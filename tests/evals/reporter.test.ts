import { describe, expect, it } from "vitest";
import { generateMarkdown } from "../../evals/src/reporter";
import type { EvalResults } from "../../evals/src/types";

describe("eval reporting", () => {
  it("includes remaining rule ids and rejection reasons in markdown details", () => {
    const results: EvalResults = {
      date: "2026-04-06",
      model: "claude-haiku-4-5-20251001",
      pluginVersion: "0.11.1",
      results: [
        {
          fixture: "event-system.ts",
          mode: "treatment",
          iterations: 2,
          resolved: false,
          finalViolationCount: 1,
          iterationRecords: [
            {
              iteration: 1,
              violationsBefore: 21,
              violationsAfter: 1,
              remainingRuleIds: ["llm-core/explicit-export-types"],
            },
            {
              iteration: 2,
              violationsBefore: 1,
              violationsAfter: 1,
              rejectedCandidate: "dropped-exported-api",
              remainingRuleIds: ["llm-core/explicit-export-types"],
            },
          ],
        },
      ],
    };

    const markdown = generateMarkdown(results);

    expect(markdown).toContain(
      "remaining rules: llm-core/explicit-export-types",
    );
    expect(markdown).toContain("candidate rejected: dropped-exported-api");
  });
});
