import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, expect, it } from "vitest";

const repository = resolve(__dirname, "../../../..");
const temporaryDirectories: string[] = [];

// Run the actual workflow shell, not a second implementation of its logic.
function workflowStep(name: string): string {
  const workflow = readFileSync(
    resolve(repository, ".github/workflows/release.yml"),
    "utf8",
  );
  const step = workflow.split(`      - name: ${name}\n`)[1];
  if (!step) throw new Error(`Missing workflow step: ${name}`);
  const run = step.split("        run: |\n")[1];
  if (!run) throw new Error(`Missing shell script: ${name}`);
  const lines: string[] = [];
  for (const line of run.split("\n")) {
    if (!line.startsWith("          ")) break;
    lines.push(line.slice(10));
  }
  return lines.join("\n");
}

const mcpTag = "eslint-plugin-llm-core-mcp@0.0.0";
const qualityTag = "llm-core-quality@0.0.0";

function fixture() {
  const directory = mkdtempSync(resolve(tmpdir(), "release-tag-test-"));
  temporaryDirectories.push(directory);
  const remote = resolve(directory, "remote.git");
  const work = resolve(directory, "work");
  const bin = resolve(directory, "bin");
  mkdirSync(work);
  mkdirSync(bin);

  function git(...args: string[]): string {
    return execFileSync("git", args, {
      cwd: work,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  }

  git("init", "--bare", "-b", "main", remote);
  git("init", "-b", "main");
  git("config", "user.name", "Release test");
  git("config", "user.email", "release-test@example.invalid");
  git("commit", "--allow-empty", "--no-gpg-sign", "-m", "Publishing commit");
  const published = git("rev-parse", "HEAD");
  git("commit", "--allow-empty", "--no-gpg-sign", "-m", "Later main commit");
  const advanced = git("rev-parse", "HEAD");
  git("remote", "add", "origin", remote);
  git("push", "origin", "main");

  const helper = ".github/scripts/release-tag.sh";
  if (existsSync(resolve(repository, helper))) {
    mkdirSync(resolve(work, ".github/scripts"), { recursive: true });
    copyFileSync(resolve(repository, helper), resolve(work, helper));
  }

  const calls = resolve(directory, "github-calls");
  const npmCalls = resolve(directory, "npm-calls");
  const publishCalls = resolve(directory, "publish-calls");
  writeFileSync(
    resolve(bin, "gh"),
    '#!/bin/bash\nif [[ "$1 $2" == "release view" ]]; then exit "${RELEASE_EXISTS:-1}"; fi\nprintf "%s\\n" "$@" >> "$GH_CALLS"\n',
    { mode: 0o755 },
  );
  // Never allow the workflow's package commands to reach a registry.
  for (const command of ["npm", "npx"]) {
    writeFileSync(
      resolve(bin, command),
      command === "npm"
        ? '#!/bin/bash\nprintf "%s\\n" "$@" >> "$NPM_CALLS"\necho "${NPM_REMOTE_VERSION:-0.0.0-old}"\n'
        : '#!/bin/bash\nprintf "%s\\n" "$@" >> "$PUBLISH_CALLS"\n',
      { mode: 0o755 },
    );
  }
  for (const name of ["eslint-plugin", "mcp-server", "quality-cli"]) {
    const packageDirectory = resolve(work, "packages", name);
    mkdirSync(packageDirectory, { recursive: true });
    writeFileSync(
      resolve(packageDirectory, "package.json"),
      '{"version":"0.0.0"}',
    );
  }

  function run(step = "Create GitHub Release", env: NodeJS.ProcessEnv = {}) {
    return spawnSync(
      "bash",
      ["-e", "-o", "pipefail", "-c", workflowStep(step)],
      {
        cwd: work,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${bin}:${process.env.PATH}`,
          GITHUB_SHA: published,
          GH_CALLS: calls,
          NPM_CALLS: npmCalls,
          PUBLISH_CALLS: publishCalls,
          GITHUB_OUTPUT: resolve(directory, "output"),
          RELEASE_TAGS: "v0.0.0",
          ...env,
        },
      },
    );
  }

  return {
    directory,
    work,
    remote,
    published,
    advanced,
    git,
    calls,
    npmCalls,
    publishCalls,
    run,
    setVersion(name: string, version: string) {
      writeFileSync(
        resolve(work, "packages", name, "package.json"),
        JSON.stringify({ version }),
      );
    },
    output: () => readFileSync(resolve(directory, "output"), "utf8"),
    githubCalls: () =>
      existsSync(calls) ? readFileSync(calls, "utf8").trim().split("\n") : [],
    publishedWorkspaces: () =>
      existsSync(publishCalls)
        ? readFileSync(publishCalls, "utf8")
            .split("\n")
            .filter((_, index, lines) => lines[index - 1] === "--workspace")
        : [],
    remoteTags: () => git("ls-remote", "--tags", "origin"),
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

it("creates a release at the publishing commit when main has advanced", () => {
  const context = fixture();
  const result = context.run();

  expect(result.status, result.stderr).toBe(0);
  expect(readFileSync(context.calls, "utf8").trim().split("\n")).toEqual([
    "release",
    "create",
    "v0.0.0",
    "--target",
    context.published,
    "--generate-notes",
  ]);
});

it("rejects a mismatched tag even when its release already exists", () => {
  const context = fixture();
  context.git("tag", "v0.0.0", context.advanced);
  context.git("push", "origin", "refs/tags/v0.0.0");

  const result = context.run("Create GitHub Release", { RELEASE_EXISTS: "0" });

  expect(result.status).toBe(1);
  expect(result.stderr).toContain(
    `Release tag v0.0.0 points to ${context.advanced}`,
  );
  expect(result.stderr).toContain(
    `expected publishing commit ${context.published}`,
  );
  expect(existsSync(context.calls)).toBe(false);
  expect(context.git("ls-remote", "origin", "refs/tags/v0.0.0")).toBe(
    `${context.advanced}\trefs/tags/v0.0.0`,
  );
});

it("accepts an annotated tag at the publishing commit", () => {
  const context = fixture();
  context.git("tag", "-a", "v0.0.0", context.published, "-m", "Release tag");
  context.git("push", "origin", "refs/tags/v0.0.0");

  const result = context.run("Create GitHub Release", { RELEASE_EXISTS: "0" });

  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain(
    `already exists at ${context.published}, skipping`,
  );
  expect(existsSync(context.calls)).toBe(false);
});

it("stops before npm publication when the existing tag targets a different commit", () => {
  const context = fixture();
  context.git("tag", "v0.0.0", context.advanced);
  context.git("push", "origin", "refs/tags/v0.0.0");

  const result = context.run("Publish to npm");

  expect(result.status).toBe(1);
  expect(result.stderr).toContain(
    `expected publishing commit ${context.published}`,
  );
  expect(existsSync(context.publishCalls)).toBe(false);
  expect(existsSync(context.calls)).toBe(false);
});

it("preserves the no-op for a later push whose package versions are already published", () => {
  const context = fixture();
  context.git("tag", "v0.0.0", context.published);
  context.git("push", "origin", "refs/tags/v0.0.0");

  const result = context.run("Publish to npm", {
    GITHUB_SHA: context.advanced,
    NPM_REMOTE_VERSION: "0.0.0",
  });

  expect(result.status, result.stderr).toBe(0);
  expect(context.output()).toBe("tags=\n");
  expect(existsSync(context.publishCalls)).toBe(false);
  expect(existsSync(context.calls)).toBe(false);
});

it("creates a missing release for a matching lightweight tag", () => {
  const context = fixture();
  context.git("tag", "v0.0.0", context.published);
  context.git("push", "origin", "refs/tags/v0.0.0");
  const result = context.run();
  expect(result.status, result.stderr).toBe(0);
  expect(readFileSync(context.calls, "utf8").trim().split("\n")).toEqual([
    "release",
    "create",
    "v0.0.0",
    "--target",
    context.published,
    "--generate-notes",
  ]);
  expect(context.git("ls-remote", "origin", "refs/tags/v0.0.0")).toBe(
    `${context.published}\trefs/tags/v0.0.0`,
  );
});

it("rejects an annotated tag at another commit without changing it", () => {
  const context = fixture();
  context.git(
    "tag",
    "-a",
    "v0.0.0",
    context.advanced,
    "-m",
    "Wrong release commit",
  );
  context.git("push", "origin", "refs/tags/v0.0.0");
  const before = context.git(
    "ls-remote",
    "origin",
    "refs/tags/v0.0.0",
    "refs/tags/v0.0.0^{}",
  );
  const result = context.run();
  expect(result.status).toBe(1);
  expect(result.stderr).toContain(
    `Release tag v0.0.0 points to ${context.advanced}`,
  );
  expect(existsSync(context.calls)).toBe(false);
  expect(
    context.git(
      "ls-remote",
      "origin",
      "refs/tags/v0.0.0",
      "refs/tags/v0.0.0^{}",
    ),
  ).toBe(before);
});

it("stops publication when the remote tag cannot be checked", () => {
  const context = fixture();
  context.git(
    "remote",
    "set-url",
    "origin",
    resolve(context.directory, "missing.git"),
  );
  const result = context.run("Publish to npm");
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Could not verify release tag v0.0.0");
  expect(existsSync(context.publishCalls)).toBe(false);
  expect(existsSync(context.calls)).toBe(false);
});

it("stops release creation when the remote tag cannot be checked", () => {
  const context = fixture();
  context.git(
    "remote",
    "set-url",
    "origin",
    resolve(context.directory, "missing.git"),
  );
  const result = context.run();
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Could not verify release tag v0.0.0");
  expect(existsSync(context.calls)).toBe(false);
});

it("leaves an absent tag unchanged during publication preflight", () => {
  const context = fixture();
  const result = context.run("Publish to npm");
  expect(result.status, result.stderr).toBe(0);
  expect(context.output()).toBe(`tags=v0.0.0 ${mcpTag} ${qualityTag}\n`);
  expect(
    readFileSync(context.publishCalls, "utf8").match(/publish\n/g),
  ).toHaveLength(3);
  expect(context.git("ls-remote", "origin", "refs/tags/v0.0.0")).toBe("");
  expect(existsSync(context.calls)).toBe(false);
});

it("publishes and tags only MCP when the core tag belongs to an earlier commit", () => {
  const context = fixture();
  context.git("tag", "v0.0.0", context.published);
  context.git("push", "origin", "refs/tags/v0.0.0");
  context.setVersion("mcp-server", "0.0.1");
  const env = { GITHUB_SHA: context.advanced, NPM_REMOTE_VERSION: "0.0.0" };

  const publish = context.run("Publish to npm", env);

  expect(publish.status, publish.stderr).toBe(0);
  expect(context.publishedWorkspaces()).toEqual(["eslint-plugin-llm-core-mcp"]);
  expect(context.output()).toBe("tags=eslint-plugin-llm-core-mcp@0.0.1\n");

  const release = context.run("Create GitHub Release", {
    ...env,
    RELEASE_TAGS: "eslint-plugin-llm-core-mcp@0.0.1",
  });

  expect(release.status, release.stderr).toBe(0);
  expect(context.githubCalls()).toEqual([
    "release",
    "create",
    "eslint-plugin-llm-core-mcp@0.0.1",
    "--target",
    context.advanced,
    "--generate-notes",
    "--latest=false",
  ]);
  expect(context.remoteTags()).toBe(`${context.published}\trefs/tags/v0.0.0`);
});

it("publishes and tags only quality when the core tag belongs to an earlier commit", () => {
  const context = fixture();
  context.git("tag", "v0.0.0", context.published);
  context.git("push", "origin", "refs/tags/v0.0.0");
  context.setVersion("quality-cli", "0.0.1");

  const publish = context.run("Publish to npm", {
    GITHUB_SHA: context.advanced,
    NPM_REMOTE_VERSION: "0.0.0",
  });

  expect(publish.status, publish.stderr).toBe(0);
  expect(context.publishedWorkspaces()).toEqual(["llm-core-quality"]);
  expect(context.output()).toBe("tags=llm-core-quality@0.0.1\n");
});

it("publishes and tags only core when only the core version is unpublished", () => {
  const context = fixture();
  context.git("tag", mcpTag, context.published);
  context.git("push", "origin", `refs/tags/${mcpTag}`);
  context.setVersion("eslint-plugin", "0.0.1");
  const env = { GITHUB_SHA: context.advanced, NPM_REMOTE_VERSION: "0.0.0" };

  const publish = context.run("Publish to npm", env);

  expect(publish.status, publish.stderr).toBe(0);
  expect(context.publishedWorkspaces()).toEqual(["eslint-plugin-llm-core"]);
  expect(context.output()).toBe("tags=v0.0.1\n");

  const release = context.run("Create GitHub Release", {
    ...env,
    RELEASE_TAGS: "v0.0.1",
  });

  expect(release.status, release.stderr).toBe(0);
  expect(context.githubCalls()).toEqual([
    "release",
    "create",
    "v0.0.1",
    "--target",
    context.advanced,
    "--generate-notes",
  ]);
});

it("creates one release per package when all three are published together", () => {
  const context = fixture();

  const publish = context.run("Publish to npm");

  expect(publish.status, publish.stderr).toBe(0);
  expect(context.publishedWorkspaces()).toEqual([
    "eslint-plugin-llm-core",
    "eslint-plugin-llm-core-mcp",
    "llm-core-quality",
  ]);

  const release = context.run("Create GitHub Release", {
    RELEASE_TAGS: `v0.0.0 ${mcpTag} ${qualityTag}`,
  });

  expect(release.status, release.stderr).toBe(0);
  const target = ["--target", context.published, "--generate-notes"];
  expect(context.githubCalls()).toEqual([
    ...["release", "create", "v0.0.0", ...target],
    ...["release", "create", mcpTag, ...target, "--latest=false"],
    ...["release", "create", qualityTag, ...target, "--latest=false"],
  ]);
});

it("publishes nothing when one package tag targets a different commit", () => {
  const context = fixture();
  context.git("tag", qualityTag, context.advanced);
  context.git("push", "origin", `refs/tags/${qualityTag}`);

  const result = context.run("Publish to npm");

  expect(result.status).toBe(1);
  expect(result.stderr).toContain(
    `Release tag ${qualityTag} points to ${context.advanced}`,
  );
  expect(context.publishedWorkspaces()).toEqual([]);
  expect(context.githubCalls()).toEqual([]);
});

it("creates no release when one package tag targets a different commit", () => {
  const context = fixture();
  context.git("tag", qualityTag, context.advanced);
  context.git("push", "origin", `refs/tags/${qualityTag}`);

  const result = context.run("Create GitHub Release", {
    RELEASE_TAGS: `v0.0.0 ${mcpTag} ${qualityTag}`,
  });

  expect(result.status).toBe(1);
  expect(result.stderr).toContain(
    `Release tag ${qualityTag} points to ${context.advanced}`,
  );
  expect(context.githubCalls()).toEqual([]);
  expect(context.remoteTags()).toBe(
    `${context.advanced}\trefs/tags/${qualityTag}`,
  );
});

it("rejects a missing publishing SHA before any release operation", () => {
  const context = fixture();
  const result = context.run("Create GitHub Release", { GITHUB_SHA: "" });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Expected the publishing commit SHA");
  expect(existsSync(context.calls)).toBe(false);
});
