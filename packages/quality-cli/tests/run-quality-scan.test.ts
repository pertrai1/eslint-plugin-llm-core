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

  it("fails on tool execution errors even when findings are allowed", async () => {
    const result = await runQualityScan(
      {
        command: "scan",
        reporter: "json",
        cwd: "/repo",
        targets: ["src"],
        engines: ["eslint"],
        failOnFindings: false,
      },
      fakeExecutor({ eslint: 2 }),
    );

    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.findings).toEqual([]);
    expect(result.invocations[0]?.exitCode).toBe(2);
  });
});
