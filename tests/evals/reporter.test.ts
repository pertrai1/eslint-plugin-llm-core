import { describe, expect, it } from "vitest";
import { generateJson, generateMarkdown } from "../../evals/src/reporter";
import type { EvalResults } from "../../evals/src/types";

describe("eval reporting", () => {
  it("includes remaining rule ids and rejection reasons in markdown details", () => {
    const results: EvalResults = {
      date: "2026-04-06",
      model: "claude-haiku-4-5-20251001",
      pluginVersion: "0.11.1",
      gitCommit: "abc1234",
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

  it("includes gitCommit in JSON and markdown output", () => {
    const results: EvalResults = {
      date: "2026-04-07",
      model: "claude-sonnet-4-20250514",
      pluginVersion: "0.12.0",
      gitCommit: "f3a9b21",
      results: [
        {
          fixture: "api-service.ts",
          mode: "treatment",
          iterations: 1,
          resolved: true,
          finalViolationCount: 0,
          iterationRecords: [
            {
              iteration: 1,
              violationsBefore: 5,
              violationsAfter: 0,
            },
          ],
        },
      ],
    };

    const json = generateJson(results);
    const parsed = JSON.parse(json) as EvalResults;
    expect(parsed.gitCommit).toBe("f3a9b21");

    const markdown = generateMarkdown(results);
    expect(markdown).toContain("**Commit**: f3a9b21");
  });
});
