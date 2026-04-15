/**
 * End-to-end tests for generated instructions.
 *
 * Uses real ESLint flat config fixtures that import the actual built plugin
 * from dist/. Exercises the full pipeline: config file → ESLint config
 * resolution → scope derivation → option interpolation → markdown generation.
 */
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { generateInstructions } from "../../src/generate-instructions";

const fixturesDir = path.join(__dirname, "..", "fixtures");
const recommendedConfig = path.join(fixturesDir, "e2e-recommended.config.mjs");
const customConfig = path.join(fixturesDir, "e2e-custom.config.mjs");

function runCli(
  args: string[],
  cwd?: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const cliPath = path.resolve(
    __dirname,
    "../../dist/cli/generate-instructions.js",
  );

  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [cliPath, ...args],
      { cwd: cwd ?? fixturesDir, timeout: 30_000 },
      (error, stdout, stderr) => {
        resolve({
          stdout,
          stderr,
          exitCode: error ? 1 : 0,
        });
      },
    );
  });
}

describe("e2e: generateInstructions with recommended config", () => {
  const result = generateInstructions({ configPath: recommendedConfig });

  it("resolves all recommended rules as active", async () => {
    const { activeRules } = await result;
    expect(activeRules.length).toBeGreaterThanOrEqual(20);
  });

  it("places explicit-export-types in the TypeScript Files Only section", async () => {
    const { typescriptRules } = await result;
    const names = typescriptRules.map((r) => r.name);
    expect(names).toContain("explicit-export-types");
  });

  it("places no-empty-catch in the All Files section", async () => {
    const { allFilesRules } = await result;
    const names = allFilesRules.map((r) => r.name);
    expect(names).toContain("no-empty-catch");
  });

  it("interpolates default option values into instructions", async () => {
    const { allFilesRules } = await result;
    const maxFn = allFilesRules.find((r) => r.name === "max-function-length");
    expect(maxFn).toBeDefined();
    expect(maxFn!.instruction).toContain("under 50 lines");
  });

  it("uses default complexity value in instruction", async () => {
    const { allFilesRules } = await result;
    const complexity = allFilesRules.find((r) => r.name === "max-complexity");
    expect(complexity).toBeDefined();
    expect(complexity!.instruction).toContain("under 10");
  });

  it("generates markdown with both All Files and TypeScript Files Only sections", async () => {
    const { content } = await result;
    expect(content).toContain("## All Files");
    expect(content).toContain("## TypeScript Files Only");
  });

  it("generates the correct header", async () => {
    const { content } = await result;
    expect(content).toContain("# Coding Guidelines");
    expect(content).toContain("Regenerate with: npx generate-instructions");
  });

  it("renders no-llm-artifacts rule (present in recommended)", async () => {
    const { activeRules } = await result;
    const names = activeRules.map((r) => r.name);
    expect(names).toContain("no-llm-artifacts");
  });

  it("produces a non-empty instruction for every active rule", async () => {
    const { activeRules } = await result;
    for (const rule of activeRules) {
      expect(rule.instruction.length).toBeGreaterThan(0);
    }
  });
});

describe("e2e: generateInstructions with custom config", () => {
  const result = generateInstructions({ configPath: customConfig });

  it("interpolates custom max-function-length option", async () => {
    const { allFilesRules } = await result;
    const fn = allFilesRules.find((r) => r.name === "max-function-length");
    expect(fn).toBeDefined();
    expect(fn!.instruction).toContain("under 30 lines");
    expect(fn!.instruction).not.toContain("{max}");
  });

  it("renders array options as comma-separated list", async () => {
    const { allFilesRules } = await result;
    const magic = allFilesRules.find((r) => r.name === "no-magic-numbers");
    expect(magic).toBeDefined();
    expect(magic!.instruction).toContain("ignore: 0, 1, 2, -1");
  });

  it("renders warn-severity rules identically to error-severity rules", async () => {
    const { allFilesRules } = await result;
    const emptyCatch = allFilesRules.find((r) => r.name === "no-empty-catch");
    expect(emptyCatch).toBeDefined();
    expect(emptyCatch!.instruction).toBe(
      "Never leave catch blocks empty — handle, rethrow, or log the error",
    );
  });

  it("excludes rules that are turned off", async () => {
    const { activeRules } = await result;
    const names = activeRules.map((r) => r.name);
    expect(names).not.toContain("no-llm-artifacts");
    expect(names).not.toContain("no-inline-disable");
    expect(names).not.toContain("no-commented-out-code");
  });

  it("places explicit-export-types in TypeScript Files Only section", async () => {
    const { typescriptRules } = await result;
    const names = typescriptRules.map((r) => r.name);
    expect(names).toContain("explicit-export-types");
  });

  it("produces exact expected markdown for the custom fixture", async () => {
    const { content } = await result;
    expect(content).toBe(`# Coding Guidelines

Generated from eslint-plugin-llm-core configuration.
Regenerate with: npx generate-instructions

## All Files

- Keep functions under 30 lines — extract helpers when they grow
- Never leave catch blocks empty — handle, rethrow, or log the error
- Extract named constants for magic numbers (ignore: 0, 1, 2, -1)
- Always throw Error objects, never strings or plain objects

## TypeScript Files Only

- Add explicit parameter and return type annotations on all exported functions
`);
  });

  it("places non-TS-only rules in All Files section", async () => {
    const { allFilesRules } = await result;
    const names = allFilesRules.map((r) => r.name);
    expect(names).toContain("max-function-length");
    expect(names).toContain("no-empty-catch");
    expect(names).toContain("no-magic-numbers");
    expect(names).toContain("throw-error-objects");
  });
});

describe("e2e: CLI generate-instructions", () => {
  const tmpDir = path.join(fixturesDir, "__tmp_cli_test__");

  beforeAll(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("--dry-run prints markdown to stdout", async () => {
    const { stdout, exitCode } = await runCli([
      "--config",
      customConfig,
      "--dry-run",
    ]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("# Coding Guidelines");
    expect(stdout).toContain("## All Files");
    expect(stdout).toContain("under 30 lines");
    expect(stdout).toContain("## TypeScript Files Only");
  });

  it("writes .agents/linting-rules.md to CWD when no --dry-run", async () => {
    const { exitCode } = await runCli(["--config", customConfig], tmpDir);
    expect(exitCode).toBe(0);

    const written = path.join(tmpDir, ".agents", "linting-rules.md");
    expect(fs.existsSync(written)).toBe(true);

    const content = fs.readFileSync(written, "utf-8");
    expect(content).toContain("# Coding Guidelines");
    expect(content).toContain("under 30 lines");
  });

  it("overwrites existing .agents/linting-rules.md on re-run", async () => {
    const agentsDir = path.join(tmpDir, ".agents");
    const written = path.join(agentsDir, "linting-rules.md");

    await runCli(["--config", customConfig], tmpDir);
    expect(fs.existsSync(written)).toBe(true);

    fs.writeFileSync(written, "STALE SENTINEL CONTENT", "utf-8");

    await runCli(["--config", customConfig], tmpDir);
    const overwritten = fs.readFileSync(written, "utf-8");
    expect(overwritten).not.toBe("STALE SENTINEL CONTENT");
    expect(overwritten).toContain("# Coding Guidelines");
    expect(overwritten).toContain("under 30 lines");
  });
});
