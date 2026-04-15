import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildInjectionBlock,
  computeRelativePath,
  findInstructionFiles,
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
});
