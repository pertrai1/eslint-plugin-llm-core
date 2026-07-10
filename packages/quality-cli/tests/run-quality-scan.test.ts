import { describe, expect, it } from "vitest";

import { runQualityScan } from "../src/index.js";
import type { CommandExecutor, QualityEngine } from "../src/types.js";

function fakeExecutor(
  exitCodeByEngine: Partial<Record<QualityEngine, number>> = {},
): CommandExecutor {
  return async (engine, command, args, cwd) => {
    void cwd;

    return {
      engine,
      command,
      args,
      exitCode: exitCodeByEngine[engine] ?? 0,
      stdout: engine === "eslint" ? "[]" : "{}",
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
});
