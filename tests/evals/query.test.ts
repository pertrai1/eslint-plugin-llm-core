import { describe, expect, it } from "vitest";
import {
  queryByRule,
  queryUnresolved,
  queryStuckRules,
} from "../../evals/src/query";
import type { EvalResults, FixtureResult } from "../../evals/src/types";

function makeResult(
  overrides: Partial<FixtureResult> & Pick<FixtureResult, "fixture" | "mode">,
): FixtureResult {
  return {
    iterations: 1,
    resolved: true,
    finalViolationCount: 0,
    iterationRecords: [],
    ...overrides,
  };
}

const sampleResults: EvalResults = {
  date: "2026-04-08",
  model: "claude-sonnet-4-20250514",
  pluginVersion: "0.11.1",
  gitCommit: "a1b2c3d",
  results: [
    makeResult({
      fixture: "api-service.ts",
      mode: "treatment",
      iterations: 1,
      resolved: true,
      iterationRecords: [
        {
          iteration: 1,
          violationsBefore: 5,
          violationsAfter: 0,
          remainingRuleIds: [],
        },
      ],
    }),
    makeResult({
      fixture: "api-service.ts",
      mode: "control",
      iterations: 3,
      resolved: false,
      finalViolationCount: 2,
      iterationRecords: [
        {
          iteration: 1,
          violationsBefore: 5,
          violationsAfter: 3,
          remainingRuleIds: [
            "llm-core/no-magic-numbers",
            "llm-core/explicit-export-types",
            "llm-core/structured-logging",
          ],
        },
        {
          iteration: 2,
          violationsBefore: 3,
          violationsAfter: 2,
          remainingRuleIds: [
            "llm-core/no-magic-numbers",
            "llm-core/explicit-export-types",
          ],
        },
        {
          iteration: 3,
          violationsBefore: 2,
          violationsAfter: 2,
          remainingRuleIds: [
            "llm-core/no-magic-numbers",
            "llm-core/explicit-export-types",
          ],
        },
      ],
      patterns: {
        stuckRules: [
          "llm-core/no-magic-numbers",
          "llm-core/explicit-export-types",
        ],
        oscillatingRules: [],
        cascadingErrors: false,
      },
    }),
    makeResult({
      fixture: "event-system.ts",
      mode: "treatment",
      iterations: 2,
      resolved: true,
      iterationRecords: [
        {
          iteration: 1,
          violationsBefore: 10,
          violationsAfter: 1,
          remainingRuleIds: ["llm-core/no-magic-numbers"],
        },
        {
          iteration: 2,
          violationsBefore: 1,
          violationsAfter: 0,
          remainingRuleIds: [],
        },
      ],
    }),
  ],
};

describe("queryByRule", () => {
  it("returns per-rule appearance counts across all iterations", () => {
    const result = queryByRule([sampleResults]);

    expect(result).toContainEqual({
      ruleId: "llm-core/no-magic-numbers",
      appearances: 4,
    });
    expect(result).toContainEqual({
      ruleId: "llm-core/explicit-export-types",
      appearances: 3,
    });
    expect(result).toContainEqual({
      ruleId: "llm-core/structured-logging",
      appearances: 1,
    });
  });
});

describe("queryUnresolved", () => {
  it("returns only fixture results that were not resolved", () => {
    const result = queryUnresolved([sampleResults]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      date: "2026-04-08",
      fixture: "api-service.ts",
      mode: "control",
      finalViolationCount: 2,
    });
  });
});

describe("queryStuckRules", () => {
  it("returns stuck rules with fixture context", () => {
    const result = queryStuckRules([sampleResults]);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      ruleId: "llm-core/no-magic-numbers",
      fixture: "api-service.ts",
      mode: "control",
      date: "2026-04-08",
    });
    expect(result).toContainEqual({
      ruleId: "llm-core/explicit-export-types",
      fixture: "api-service.ts",
      mode: "control",
      date: "2026-04-08",
    });
  });
});
