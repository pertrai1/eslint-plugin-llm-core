import { describe, expect, it } from "vitest";

import {
  formatJsonReport,
  formatSarifReport,
  formatTextReport,
} from "../src/index.js";
import type { QualityScanResult } from "../src/types.js";

const RESULT_WITH_FINDINGS: QualityScanResult = {
  ok: false,
  exitCode: 1,
  findings: [
    {
      engine: "eslint",
      severity: "error",
      message: "Unexpected any",
      filePath: "/repo/src/index.ts",
      ruleId: "@typescript-eslint/no-explicit-any",
      line: 3,
      column: 10,
    },
    {
      engine: "knip",
      severity: "warning",
      message: "Unused dependency lodash",
      filePath: "/repo/package.json",
      ruleId: "unusedDependencies",
    },
  ],
  invocations: [
    {
      engine: "eslint",
      command: "eslint",
      args: ["src", "--format", "json"],
      exitCode: 1,
      stdout: "[]",
      stderr: "",
    },
    {
      engine: "knip",
      command: "knip",
      args: ["--reporter", "json", "--no-exit-code"],
      exitCode: 1,
      stdout: "{}",
      stderr: "",
    },
  ],
};

const formatText = formatTextReport as (
  result: QualityScanResult,
  options?: { cwd?: string; color?: boolean; compact?: boolean },
) => string;
const formatJson = formatJsonReport as (
  result: QualityScanResult,
  options?: { compact?: boolean },
) => string;
const formatSarif = formatSarifReport as (
  result: QualityScanResult,
  options?: { compact?: boolean },
) => string;

const ANSI_PATTERN = /\u001B\[[0-?]*[ -/]*[@-~]/g;

describe("reporters", () => {
  it("formats grouped text findings with relative paths and a severity summary", () => {
    const output = formatText(RESULT_WITH_FINDINGS, {
      cwd: "/repo",
      color: false,
    });

    expect(output).toContain("llm-core-quality");
    expect(output).toContain("ESLint completed: 1 finding");
    expect(output).toContain("Knip completed: 1 finding");
    expect(output).toContain("src/index.ts");
    expect(output).toContain("package.json");
    expect(output).not.toContain("/repo/src/index.ts");
    expect(output).toContain(
      "error    @typescript-eslint/no-explicit-…  Unexpected any  3:10",
    );
    expect(output).toContain(
      "warning  unusedDependencies                Unused dependency lodash",
    );
    expect(output).toContain("errors:   1");
    expect(output).toContain("warnings: 1");
    expect(output).toContain("status:   fail");
  });

  it("omits llm-core rule detail in compact text output", () => {
    const output = formatText(
      {
        ok: false,
        exitCode: 1,
        findings: [
          {
            engine: "eslint",
            severity: "error",
            message:
              "What: Promise.all is unbounded.\n\nWhy: Large inputs can exhaust memory.\n\nHow to fix: Limit concurrency.",
            filePath: "/repo/src/index.ts",
            ruleId: "llm-core/no-unbounded-promise-all",
            line: 12,
            column: 5,
          },
          {
            engine: "eslint",
            severity: "error",
            message: "Unexpected any",
            filePath: "/repo/src/index.ts",
            ruleId: "@typescript-eslint/no-explicit-any",
            line: 20,
            column: 10,
          },
        ],
        invocations: [
          {
            engine: "eslint",
            command: "eslint",
            args: [],
            exitCode: 1,
            stdout: "[]",
            stderr: "",
          },
        ],
      },
      { cwd: "/repo", color: false, compact: true },
    );

    expect(output).toContain("llm-core/no-unbounded-promise-a…  12:5");
    expect(output).not.toContain("What: Promise.all is unbounded");
    expect(output).not.toContain("Why: Large inputs can exhaust memory");
    expect(output).not.toContain("How to fix: Limit concurrency");
    expect(output).toContain(
      "@typescript-eslint/no-explicit-…  Unexpected any  20:10",
    );
  });

  it("colors text output only when enabled", () => {
    const colored = formatText(RESULT_WITH_FINDINGS, {
      cwd: "/repo",
      color: true,
    });
    const plain = formatText(RESULT_WITH_FINDINGS, {
      cwd: "/repo",
      color: false,
    });

    expect(colored).toContain("\u001B[");
    expect(plain).not.toContain("\u001B[");
  });

  it("keeps colored severity columns aligned and truncates long rule ids", () => {
    const result: QualityScanResult = {
      ok: false,
      exitCode: 1,
      findings: [
        {
          engine: "eslint",
          severity: "error",
          message: "Short rule finding",
          filePath: "/repo/src/index.ts",
          ruleId: "short",
        },
        {
          engine: "eslint",
          severity: "warning",
          message: "Long rule finding",
          filePath: "/repo/src/index.ts",
          ruleId: "very-long-rule-name-that-exceeds-the-column-cap",
        },
      ],
      invocations: [
        {
          engine: "eslint",
          command: "eslint",
          args: [],
          exitCode: 1,
          stdout: "[]",
          stderr: "",
        },
      ],
    };

    const stripped = formatText(result, { cwd: "/repo", color: true }).replace(
      ANSI_PATTERN,
      "",
    );

    expect(stripped).toContain("error    short");
    expect(stripped).toContain("very-long-rule-name-that-exceed…");
    expect(stripped).not.toContain(
      "very-long-rule-name-that-exceeds-the-column-cap",
    );
  });

  it("formats normalized JSON with pretty and compact modes", () => {
    expect(formatJson(RESULT_WITH_FINDINGS)).toContain('\n  "ok": false');
    expect(formatJson(RESULT_WITH_FINDINGS, { compact: true })).toBe(
      `${JSON.stringify(RESULT_WITH_FINDINGS)}\n`,
    );
  });

  it("formats SARIF 2.1.0 with pretty and compact modes", () => {
    const pretty = JSON.parse(formatSarif(RESULT_WITH_FINDINGS)) as {
      version?: string;
      runs?: Array<{ results?: Array<{ ruleId?: string; level?: string }> }>;
    };
    const compact = formatSarif(RESULT_WITH_FINDINGS, { compact: true });

    expect(pretty.version).toBe("2.1.0");
    expect(pretty.runs?.[0]?.results?.[0]).toMatchObject({
      ruleId: "@typescript-eslint/no-explicit-any",
      level: "error",
    });
    expect(compact).not.toContain("\n  ");
    expect(JSON.parse(compact)).toMatchObject({ version: "2.1.0" });
  });
});
