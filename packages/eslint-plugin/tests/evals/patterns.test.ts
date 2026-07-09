import { describe, expect, it } from "vitest";
import { detectPatterns } from "../../evals/src/patterns";
import type { IterationRecord } from "../../evals/src/types";

describe("detectPatterns", () => {
  it("identifies stuck rules that persist across all iterations", () => {
    const records: IterationRecord[] = [
      {
        iteration: 1,
        violationsBefore: 5,
        violationsAfter: 2,
        remainingRuleIds: [
          "llm-core/explicit-export-types",
          "llm-core/no-magic-numbers",
        ],
      },
      {
        iteration: 2,
        violationsBefore: 2,
        violationsAfter: 1,
        remainingRuleIds: ["llm-core/no-magic-numbers"],
      },
      {
        iteration: 3,
        violationsBefore: 1,
        violationsAfter: 1,
        remainingRuleIds: ["llm-core/no-magic-numbers"],
      },
    ];

    const patterns = detectPatterns(records);

    expect(patterns.stuckRules).toEqual(["llm-core/no-magic-numbers"]);
  });

  it("identifies oscillating rules that are resolved then reintroduced", () => {
    const records: IterationRecord[] = [
      {
        iteration: 1,
        violationsBefore: 5,
        violationsAfter: 2,
        remainingRuleIds: [
          "llm-core/explicit-export-types",
          "llm-core/no-magic-numbers",
        ],
      },
      {
        iteration: 2,
        violationsBefore: 2,
        violationsAfter: 1,
        remainingRuleIds: ["llm-core/no-magic-numbers"],
      },
      {
        iteration: 3,
        violationsBefore: 1,
        violationsAfter: 2,
        remainingRuleIds: [
          "llm-core/explicit-export-types",
          "llm-core/no-magic-numbers",
        ],
      },
    ];

    const patterns = detectPatterns(records);

    expect(patterns.oscillatingRules).toEqual([
      "llm-core/explicit-export-types",
    ]);
  });

  it("detects cascading errors when any iteration introduces new violations", () => {
    const records: IterationRecord[] = [
      {
        iteration: 1,
        violationsBefore: 5,
        violationsAfter: 3,
        violationDiff: {
          resolved: [
            {
              ruleId: "llm-core/no-magic-numbers",
              message: "x",
              line: 1,
              column: 1,
            },
            {
              ruleId: "llm-core/no-magic-numbers",
              message: "x",
              line: 2,
              column: 1,
            },
            {
              ruleId: "llm-core/no-magic-numbers",
              message: "x",
              line: 3,
              column: 1,
            },
          ],
          persisted: [
            {
              ruleId: "llm-core/explicit-export-types",
              message: "x",
              line: 10,
              column: 1,
            },
          ],
          introduced: [
            {
              ruleId: "llm-core/structured-logging",
              message: "x",
              line: 15,
              column: 1,
            },
          ],
        },
      },
    ];

    const patterns = detectPatterns(records);

    expect(patterns.cascadingErrors).toBe(true);
  });

  it("reports no cascading errors when no iteration introduces new violations", () => {
    const records: IterationRecord[] = [
      {
        iteration: 1,
        violationsBefore: 5,
        violationsAfter: 2,
        violationDiff: {
          resolved: [
            {
              ruleId: "llm-core/no-magic-numbers",
              message: "x",
              line: 1,
              column: 1,
            },
            {
              ruleId: "llm-core/no-magic-numbers",
              message: "x",
              line: 2,
              column: 1,
            },
            {
              ruleId: "llm-core/no-magic-numbers",
              message: "x",
              line: 3,
              column: 1,
            },
          ],
          persisted: [
            {
              ruleId: "llm-core/explicit-export-types",
              message: "x",
              line: 10,
              column: 1,
            },
            {
              ruleId: "llm-core/structured-logging",
              message: "x",
              line: 15,
              column: 1,
            },
          ],
          introduced: [],
        },
      },
    ];

    const patterns = detectPatterns(records);

    expect(patterns.cascadingErrors).toBe(false);
  });

  it("returns empty patterns for a single iteration with no issues", () => {
    const records: IterationRecord[] = [
      {
        iteration: 1,
        violationsBefore: 3,
        violationsAfter: 0,
        remainingRuleIds: [],
      },
    ];

    const patterns = detectPatterns(records);

    expect(patterns.stuckRules).toEqual([]);
    expect(patterns.oscillatingRules).toEqual([]);
    expect(patterns.cascadingErrors).toBe(false);
  });
});
