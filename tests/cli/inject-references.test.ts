import fs from "fs";
import os from "os";
import path from "path";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  buildInjectionBlock,
  computeRelativePath,
  findInstructionFiles,
  injectReferences,
  injectionBlockEnd,
  injectionBlockStart,
  replaceOrAppendBlock,
} from "../../src/cli/inject-references";

describe("inject-references", () => {
  let tmpDir = "";

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "llm-core-inject-"));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("findInstructionFiles detects existing instruction files at the repo root", () => {
    fs.writeFileSync(path.join(tmpDir, "AGENTS.md"), "# Agents\n", "utf-8");
    fs.mkdirSync(path.join(tmpDir, ".github"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, ".github", "copilot-instructions.md"),
      "# Copilot\n",
      "utf-8",
    );

    expect(findInstructionFiles(tmpDir)).toEqual([
      "AGENTS.md",
      ".github/copilot-instructions.md",
    ]);
  });

  it("computeRelativePath returns the correct path for root and .github files", () => {
    expect(computeRelativePath("AGENTS.md")).toBe(".agents/linting-rules.md");
    expect(computeRelativePath("CLAUDE.md")).toBe(".agents/linting-rules.md");
    expect(computeRelativePath(".github/copilot-instructions.md")).toBe(
      "../.agents/linting-rules.md",
    );
  });

  it("buildInjectionBlock produces the delimited reference block", () => {
    expect(buildInjectionBlock("../.agents/linting-rules.md"))
      .toBe(`<!-- llm-core-instructions:start -->
See [\`.agents/linting-rules.md\`](../.agents/linting-rules.md) for coding guidelines derived from your ESLint config.
Regenerate with: \`npx llm-core-instructions\`
<!-- llm-core-instructions:end -->`);
  });

  it("replaceOrAppendBlock replaces an existing block in place", () => {
    const original = `# Title

${injectionBlockStart}
Old block
${injectionBlockEnd}

Existing content
`;
    const replacement = buildInjectionBlock(".agents/linting-rules.md");

    expect(replaceOrAppendBlock(original, replacement)).toBe(`# Title

${replacement}

Existing content
`);
  });

  it("replaceOrAppendBlock appends when no existing block is present", () => {
    const content = "# Existing Doc\n\nSome content\n";
    const block = buildInjectionBlock(".agents/linting-rules.md");

    const result = replaceOrAppendBlock(content, block);
    expect(result).toContain(injectionBlockStart);
    expect(result).toContain(injectionBlockEnd);
    expect(result).toContain("# Existing Doc");
    expect(result).toContain("Some content");
    expect(result.indexOf("# Existing Doc")).toBeLessThan(
      result.indexOf(injectionBlockStart),
    );
  });

  it("replaceOrAppendBlock is idempotent — re-running produces identical output", () => {
    const content = "# Doc\n\nHello\n";
    const block = buildInjectionBlock(".agents/linting-rules.md");
    const first = replaceOrAppendBlock(content, block);
    const second = replaceOrAppendBlock(first, block);
    expect(second).toBe(first);
  });

  it("findInstructionFiles returns empty array when no instruction files exist", () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "llm-core-empty-"));
    try {
      expect(findInstructionFiles(emptyDir)).toEqual([]);
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });
});

describe("injectReferences integration", () => {
  let tmpDir = "";

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "llm-core-integ-"));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("injects into all detected files and preserves surrounding content", () => {
    fs.writeFileSync(
      path.join(tmpDir, "AGENTS.md"),
      "# Before\n\nSome agents content\n",
      "utf-8",
    );
    fs.writeFileSync(
      path.join(tmpDir, "CLAUDE.md"),
      "# Claude\n\nClaude content\n",
      "utf-8",
    );
    fs.mkdirSync(path.join(tmpDir, ".github"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, ".github", "copilot-instructions.md"),
      "# Copilot\n\nCopilot content\n",
      "utf-8",
    );

    const modified = injectReferences(tmpDir);

    expect(modified).toEqual([
      "AGENTS.md",
      "CLAUDE.md",
      ".github/copilot-instructions.md",
    ]);

    const agents = fs.readFileSync(path.join(tmpDir, "AGENTS.md"), "utf-8");
    expect(agents).toContain("# Before");
    expect(agents).toContain("Some agents content");
    expect(agents).toContain(injectionBlockStart);
    expect(agents).toContain("(.agents/linting-rules.md)");

    const copilot = fs.readFileSync(
      path.join(tmpDir, ".github", "copilot-instructions.md"),
      "utf-8",
    );
    expect(copilot).toContain("(../.agents/linting-rules.md)");
  });

  it("skips missing files without error", () => {
    const singleDir = fs.mkdtempSync(path.join(os.tmpdir(), "llm-core-skip-"));
    try {
      fs.writeFileSync(
        path.join(singleDir, "CLAUDE.md"),
        "# Only Claude\n",
        "utf-8",
      );

      const modified = injectReferences(singleDir);
      expect(modified).toEqual(["CLAUDE.md"]);
    } finally {
      fs.rmSync(singleDir, { recursive: true, force: true });
    }
  });

  it("logs warning to stderr for unwritable files without crashing", () => {
    const warnDir = fs.mkdtempSync(path.join(os.tmpdir(), "llm-core-warn-"));
    try {
      const filePath = path.join(warnDir, "AGENTS.md");
      fs.writeFileSync(filePath, "# Agents\n", "utf-8");
      fs.chmodSync(filePath, 0o444);

      const stderrSpy = vi
        .spyOn(process.stderr, "write")
        .mockImplementation(() => true);

      const modified = injectReferences(warnDir);

      expect(stderrSpy).toHaveBeenCalled();
      expect(stderrSpy.mock.calls[0][0]).toContain(
        "Warning: could not inject reference into AGENTS.md",
      );
      expect(modified).toEqual([]);
    } finally {
      fs.chmodSync(path.join(warnDir, "AGENTS.md"), 0o644);
      fs.rmSync(warnDir, { recursive: true, force: true });
    }
  });
});
