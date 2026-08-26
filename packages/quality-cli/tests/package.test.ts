import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const PACKAGE_JSON = fileURLToPath(new URL("../package.json", import.meta.url));
const README = fileURLToPath(new URL("../README.md", import.meta.url));
const ROOT_README = fileURLToPath(
  new URL("../../../README.md", import.meta.url),
);
const PLUGIN_PACKAGE_JSON = fileURLToPath(
  new URL("../../eslint-plugin/package.json", import.meta.url),
);

describe("quality CLI package metadata", () => {
  it("wires the llm-core-quality bin to the built CLI", async () => {
    const pkg = JSON.parse(await readFile(PACKAGE_JSON, "utf8")) as {
      bin?: Record<string, string>;
      files?: string[];
    };

    expect(pkg.bin?.["llm-core-quality"]).toBe("dist/cli.js");
    expect(pkg.files).toContain("dist");
  });

  it("declares the initial ESLint, llm-core, Knip, and terminal color dependencies", async () => {
    const pkg = JSON.parse(await readFile(PACKAGE_JSON, "utf8")) as {
      dependencies?: Record<string, string>;
    };
    const pluginPkg = JSON.parse(
      await readFile(PLUGIN_PACKAGE_JSON, "utf8"),
    ) as { version: string };

    // eslint-plugin-llm-core is pinned exactly and bumped by Changesets on
    // every plugin release, so assert against its live version rather than
    // a literal that goes stale each release.
    expect(pkg.dependencies).toMatchObject({
      eslint: "^10.8.1",
      "eslint-plugin-llm-core": pluginPkg.version,
      knip: "^6.32.2",
      picocolors: expect.any(String),
    });
  });

  it("ships CLI setup documentation", async () => {
    await expect(access(README, constants.R_OK)).resolves.toBeUndefined();

    const readme = await readFile(README, "utf8");
    expect(readme).toContain("llm-core-quality scan --json");
    expect(readme).toContain("llm-core-quality ci");
  });

  it("documents llm-core-quality in the root package list", async () => {
    const rootReadme = await readFile(ROOT_README, "utf8");

    expect(rootReadme).toContain("packages/quality-cli");
    expect(rootReadme).toContain("llm-core-quality");
  });
});
