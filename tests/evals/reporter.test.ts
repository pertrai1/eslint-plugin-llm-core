import { describe, expect, it } from "vitest";
import {
  generateCompactJson,
  generateHistoryLine,
  generateMarkdown,
} from "../../evals/src/reporter";
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

  it("includes diagnostics section when failure patterns are detected", () => {
    const results: EvalResults = {
      date: "2026-04-08",
      model: "claude-sonnet-4-20250514",
      pluginVersion: "0.11.1",
      results: [
        {
          fixture: "api-service.ts",
          mode: "treatment",
          iterations: 3,
          resolved: false,
          finalViolationCount: 2,
          patterns: {
            stuckRules: ["llm-core/no-magic-numbers"],
            oscillatingRules: ["llm-core/explicit-export-types"],
            cascadingErrors: true,
          },
          iterationRecords: [
            {
              iteration: 1,
              violationsBefore: 5,
              violationsAfter: 3,
            },
            {
              iteration: 2,
              violationsBefore: 3,
              violationsAfter: 2,
            },
            {
              iteration: 3,
              violationsBefore: 2,
              violationsAfter: 2,
            },
          ],
        },
      ],
    };

    const markdown = generateMarkdown(results);

    expect(markdown).toContain("### Diagnostics (treatment)");
    expect(markdown).toContain("Stuck rules");
    expect(markdown).toContain("llm-core/no-magic-numbers");
    expect(markdown).toContain("Oscillating rules");
    expect(markdown).toContain("llm-core/explicit-export-types");
    expect(markdown).toContain("Cascading errors");
  });

  it("omits diagnostics section when no patterns are detected", () => {
    const results: EvalResults = {
      date: "2026-04-08",
      model: "claude-sonnet-4-20250514",
      pluginVersion: "0.11.1",
      results: [
        {
          fixture: "api-service.ts",
          mode: "treatment",
          iterations: 1,
          resolved: true,
          finalViolationCount: 0,
          patterns: {
            stuckRules: [],
            oscillatingRules: [],
            cascadingErrors: false,
          },
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

    const markdown = generateMarkdown(results);

    expect(markdown).not.toContain("### Diagnostics (");
  });
});

describe("generateCompactJson", () => {
  it("strips trace fields from resolved fixtures", () => {
    const results: EvalResults = {
      date: "2026-04-08",
      model: "claude-sonnet-4-20250514",
      pluginVersion: "0.11.1",
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
              promptSent: "Fix these violations...",
              llmResponse: "Here is the fixed code...",
              codeDiff: "-old\n+new",
              reasoning: "I added types",
            },
          ],
        },
      ],
    };

    const compact = generateCompactJson(results);
    const parsed = JSON.parse(compact) as EvalResults;
    const record = parsed.results[0]!.iterationRecords[0]!;

    expect(record.promptSent).toBeUndefined();
    expect(record.llmResponse).toBeUndefined();
    expect(record.codeDiff).toBeUndefined();
    expect(record.reasoning).toBeUndefined();
    expect(record.iteration).toBe(1);
    expect(record.violationsBefore).toBe(5);
  });

  it("preserves trace fields for unresolved fixtures", () => {
    const results: EvalResults = {
      date: "2026-04-08",
      model: "claude-sonnet-4-20250514",
      pluginVersion: "0.11.1",
      results: [
        {
          fixture: "api-service.ts",
          mode: "treatment",
          iterations: 3,
          resolved: false,
          finalViolationCount: 2,
          iterationRecords: [
            {
              iteration: 1,
              violationsBefore: 5,
              violationsAfter: 2,
              promptSent: "Fix these violations...",
              llmResponse: "Here is the fixed code...",
              codeDiff: "-old\n+new",
              reasoning: "I added types",
            },
          ],
        },
      ],
    };

    const compact = generateCompactJson(results);
    const parsed = JSON.parse(compact) as EvalResults;
    const record = parsed.results[0]!.iterationRecords[0]!;

    expect(record.promptSent).toBe("Fix these violations...");
    expect(record.llmResponse).toBe("Here is the fixed code...");
  });
});

describe("generateHistoryLine", () => {
  it("produces one JSON line per fixture result with run metadata", () => {
    const results: EvalResults = {
      date: "2026-04-08",
      model: "claude-sonnet-4-20250514",
      pluginVersion: "0.11.1",
      results: [
        {
          fixture: "api-service.ts",
          mode: "treatment",
          iterations: 1,
          resolved: true,
          finalViolationCount: 0,
          iterationRecords: [],
        },
      ],
    };

    const lines = generateHistoryLine(results);

    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]!);
    expect(parsed).toEqual({
      date: "2026-04-08",
      model: "claude-sonnet-4-20250514",
      pluginVersion: "0.11.1",
      fixture: "api-service.ts",
      mode: "treatment",
      iterations: 1,
      resolved: true,
      finalViolationCount: 0,
    });
  });
});
