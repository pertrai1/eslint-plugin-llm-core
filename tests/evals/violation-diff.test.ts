import { describe, expect, it } from "vitest";
import { computeViolationDiff } from "../../evals/src/violation-diff";
import type { LintViolation } from "../../evals/src/types";

describe("computeViolationDiff", () => {
  it("categorizes violations as resolved, persisted, or introduced", () => {
    const before: LintViolation[] = [
      {
        ruleId: "llm-core/no-magic-numbers",
        message: "No magic numbers",
        line: 5,
        column: 10,
      },
      {
        ruleId: "llm-core/explicit-export-types",
        message: "Missing return type",
        line: 10,
        column: 1,
      },
    ];

    const after: LintViolation[] = [
      {
        ruleId: "llm-core/explicit-export-types",
        message: "Missing return type",
        line: 10,
        column: 1,
      },
      {
        ruleId: "llm-core/structured-logging",
        message: "Use structured logging",
        line: 15,
        column: 3,
      },
    ];

    const diff = computeViolationDiff(before, after);

    expect(diff.resolved).toEqual([
      {
        ruleId: "llm-core/no-magic-numbers",
        message: "No magic numbers",
        line: 5,
        column: 10,
      },
    ]);
    expect(diff.persisted).toEqual([
      {
        ruleId: "llm-core/explicit-export-types",
        message: "Missing return type",
        line: 10,
        column: 1,
      },
    ]);
    expect(diff.introduced).toEqual([
      {
        ruleId: "llm-core/structured-logging",
        message: "Use structured logging",
        line: 15,
        column: 3,
      },
    ]);
  });

  it("returns all resolved when every violation is fixed", () => {
    const before: LintViolation[] = [
      {
        ruleId: "llm-core/no-magic-numbers",
        message: "No magic numbers",
        line: 5,
        column: 10,
      },
    ];

    const diff = computeViolationDiff(before, []);

    expect(diff.resolved).toEqual(before);
    expect(diff.persisted).toEqual([]);
    expect(diff.introduced).toEqual([]);
  });

  it("returns all introduced when new violations appear from clean code", () => {
    const after: LintViolation[] = [
      {
        ruleId: "llm-core/structured-logging",
        message: "Use structured logging",
        line: 3,
        column: 1,
      },
    ];

    const diff = computeViolationDiff([], after);

    expect(diff.resolved).toEqual([]);
    expect(diff.persisted).toEqual([]);
    expect(diff.introduced).toEqual(after);
  });

  it("returns empty diff when both before and after are empty", () => {
    const diff = computeViolationDiff([], []);

    expect(diff.resolved).toEqual([]);
    expect(diff.persisted).toEqual([]);
    expect(diff.introduced).toEqual([]);
  });
});
