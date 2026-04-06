import { describe, expect, it } from "vitest";
import {
  stripToFirstLine,
  stripViolationMessages,
} from "../../evals/src/strip-messages";
import type { LintViolation } from "../../evals/src/types";

describe("strip-messages", () => {
  it("keeps the first line when a message has guidance sections", () => {
    expect(
      stripToFirstLine(
        [
          "Missing type annotation.",
          "",
          "Why: explicit contracts matter.",
          "",
          "How to fix: add the type.",
        ].join("\n"),
      ),
    ).toBe("Missing type annotation.");
  });

  it("keeps the first line when a message only has single newlines", () => {
    expect(stripToFirstLine("First line\nSecond line")).toBe("First line");
  });

  it("maps every violation message without changing other fields", () => {
    const violations: LintViolation[] = [
      {
        ruleId: "llm-core/explicit-export-types",
        line: 3,
        column: 1,
        message: "Missing type annotation.\n\nWhy: contracts matter.",
      },
      {
        ruleId: "llm-core/structured-logging",
        line: 8,
        column: 5,
        message: "Use a static log message.",
      },
    ];

    expect(stripViolationMessages(violations)).toEqual([
      {
        ruleId: "llm-core/explicit-export-types",
        line: 3,
        column: 1,
        message: "Missing type annotation.",
      },
      {
        ruleId: "llm-core/structured-logging",
        line: 8,
        column: 5,
        message: "Use a static log message.",
      },
    ]);
  });
});
