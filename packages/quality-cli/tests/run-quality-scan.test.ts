import { describe, expect, it } from "vitest";

import { runQualityScan } from "../src/index.js";
import type { CommandExecutor, QualityEngine } from "../src/types.js";

function fakeExecutor(
  exitCodeByEngine: Partial<Record<QualityEngine, number>> = {},
  stdoutByEngine: Partial<Record<QualityEngine, string>> = {},
): CommandExecutor {
  return async (engine, command, args, cwd) => {
    void cwd;

    return {
      engine,
      command,
      args,
      exitCode: exitCodeByEngine[engine] ?? 0,
      stdout: stdoutByEngine[engine] ?? (engine === "eslint" ? "[]" : "{}"),
      stderr: "",
    };
  };
}

describe("runQualityScan", () => {
  it("runs ESLint and Knip for scan JSON mode without failing clean results", async () => {
    const result = await runQualityScan(
      {
        command: "scan",
        reporter: "json",
        cwd: "/repo",
        targets: ["src"],
        engines: ["eslint", "knip"],
        failOnFindings: true,
        compact: false,
        color: "auto",
        production: false,
      },
      fakeExecutor(),
    );

    expect(result.ok).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.findings).toEqual([]);
    expect(result.invocations.map((invocation) => invocation.engine)).toEqual([
      "eslint",
      "knip",
    ]);
    expect(result.invocations[0]?.args).toEqual(["src", "--format", "json"]);
    expect(result.invocations[1]?.args).toEqual([
      "--reporter",
      "json",
      "--no-exit-code",
      "--cache",
    ]);
  });

  it("passes production mode to Knip only", async () => {
    const result = await runQualityScan(
      {
        command: "scan",
        reporter: "json",
        cwd: "/repo",
        targets: ["src"],
        engines: ["eslint", "knip"],
        failOnFindings: false,
        compact: false,
        color: "auto",
        production: true,
      },
      fakeExecutor(),
    );

    expect(result.invocations[0]?.args).toEqual(["src", "--format", "json"]);
    expect(result.invocations[1]?.args).toEqual([
      "--reporter",
      "json",
      "--no-exit-code",
      "--cache",
      "--production",
    ]);
  });

  it("fails when findings are present and failOnFindings is enabled", async () => {
    const result = await runQualityScan(
      {
        command: "ci",
        reporter: "json",
        cwd: "/repo",
        targets: ["src"],
        engines: ["eslint"],
        failOnFindings: true,
        compact: false,
        color: "auto",
        production: false,
      },
      fakeExecutor(
        { eslint: 1 },
        {
          eslint: JSON.stringify([
            {
              filePath: "/repo/src/index.ts",
              messages: [
                {
                  ruleId: "no-console",
                  severity: 2,
                  message: "Unexpected console statement.",
                  line: 3,
                  column: 5,
                },
              ],
            },
          ]),
        },
      ),
    );

    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.findings).toEqual([
      {
        engine: "eslint",
        severity: "error",
        message: "Unexpected console statement.",
        filePath: "/repo/src/index.ts",
        ruleId: "no-console",
        line: 3,
        column: 5,
      },
    ]);
  });

  it("describes Knip category findings with actionable item names", async () => {
    const result = await runQualityScan(
      {
        command: "scan",
        reporter: "text",
        cwd: "/repo",
        targets: [],
        engines: ["knip"],
        failOnFindings: false,
        compact: false,
        color: "auto",
        production: false,
      },
      fakeExecutor(
        { knip: 1 },
        {
          knip: JSON.stringify({
            issues: [
              {
                file: "src/unused.ts",
                files: [{ name: "src/unused.ts" }],
              },
              {
                file: "package.json",
                dependencies: [{ name: "lodash", line: 12, col: 6 }],
              },
            ],
          }),
        },
      ),
    );

    expect(result.findings).toEqual([
      {
        engine: "knip",
        severity: "warning",
        message: "Unused file: src/unused.ts",
        filePath: "src/unused.ts",
        ruleId: "files",
      },
      {
        engine: "knip",
        severity: "warning",
        message: "Unused dependency: lodash",
        filePath: "package.json",
        ruleId: "dependencies",
        line: 12,
        column: 6,
      },
    ]);
  });

  it("fails on tool execution errors even when findings are allowed", async () => {
    const result = await runQualityScan(
      {
        command: "scan",
        reporter: "json",
        cwd: "/repo",
        targets: ["src"],
        engines: ["eslint"],
        failOnFindings: false,
        compact: false,
        color: "auto",
        production: false,
      },
      fakeExecutor({ eslint: 2 }),
    );

    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.findings).toEqual([]);
    expect(result.invocations[0]?.exitCode).toBe(2);
  });
});
