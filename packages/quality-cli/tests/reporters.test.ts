import { describe, expect, it } from "vitest";

import {
  formatJsonReport,
  formatSarifReport,
  formatTextReport,
} from "../src/index.js";
import type { QualityScanResult } from "../src/types.js";

const RESULT_WITH_FINDING: QualityScanResult = {
  ok: false,
  exitCode: 1,
  findings: [
    {
      engine: "eslint",
      severity: "error",
      message: "Unexpected any",
      filePath: "src/index.ts",
      ruleId: "@typescript-eslint/no-explicit-any",
      line: 3,
      column: 10,
    },
  ],
  invocations: [],
};

describe("reporters", () => {
  it("formats text findings for humans", () => {
    expect(formatTextReport(RESULT_WITH_FINDING)).toContain(
      "ERROR eslint @typescript-eslint/no-explicit-any src/index.ts:3:10: Unexpected any",
    );
  });

  it("formats normalized JSON", () => {
    expect(JSON.parse(formatJsonReport(RESULT_WITH_FINDING))).toMatchObject({
      ok: false,
      findings: [{ engine: "eslint", message: "Unexpected any" }],
    });
  });

  it("formats SARIF 2.1.0", () => {
    const sarif = JSON.parse(formatSarifReport(RESULT_WITH_FINDING)) as {
      version?: string;
      runs?: Array<{ results?: Array<{ ruleId?: string; level?: string }> }>;
    };

    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs?.[0]?.results?.[0]).toMatchObject({
      ruleId: "@typescript-eslint/no-explicit-any",
      level: "error",
    });
  });
});
