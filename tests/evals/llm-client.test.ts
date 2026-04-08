import { describe, expect, it } from "vitest";
import {
  SYSTEM_PROMPT,
  buildFixViolationsPrompt,
  extractReasoning,
  formatViolationList,
} from "../../evals/src/llm-client";
import { stripViolationMessages } from "../../evals/src/strip-messages";
import type { LintViolation } from "../../evals/src/types";

const sampleViolations: LintViolation[] = [
  {
    ruleId: "llm-core/explicit-export-types",
    line: 4,
    column: 2,
    message: [
      "Exported function is missing a return type.",
      "",
      "Why: exported functions need explicit contracts.",
      "",
      "How to fix:",
      "  Add an explicit return type annotation.",
    ].join("\n"),
  },
];

describe("eval prompt formatting", () => {
  it("omits rule ids from the violation list", () => {
    expect(formatViolationList(sampleViolations)).toContain(
      "1. Line 4, Col 2:",
    );
    expect(formatViolationList(sampleViolations)).not.toContain(
      "llm-core/explicit-export-types",
    );
  });

  it("keeps full guidance in treatment mode prompt content", () => {
    const prompt = buildFixViolationsPrompt(
      "export const value = 1;",
      sampleViolations,
    );

    expect(prompt).toContain(
      "Why: exported functions need explicit contracts.",
    );
    expect(prompt).toContain("How to fix:");
  });

  it("reduces control-mode violations to the first line only", () => {
    const controlViolations = stripViolationMessages(sampleViolations);
    const prompt = buildFixViolationsPrompt(
      "export const value = 1;",
      controlViolations,
    );

    expect(prompt).toContain("Exported function is missing a return type.");
    expect(prompt).not.toContain(
      "Why: exported functions need explicit contracts.",
    );
    expect(prompt).not.toContain("How to fix:");
    expect(prompt).not.toContain("llm-core/explicit-export-types");
  });
});

describe("system prompt", () => {
  it("requests reasoning in a structured tag before the code", () => {
    expect(SYSTEM_PROMPT).toContain("<reasoning>");
    expect(SYSTEM_PROMPT).toContain("</reasoning>");
  });
});

describe("extractReasoning", () => {
  it("extracts reasoning from a response with reasoning tags", () => {
    const response = [
      "<reasoning>",
      "The function is missing a return type annotation.",
      "I need to add Promise<void> as the return type.",
      "</reasoning>",
      "```typescript",
      "export async function fetchUser(): Promise<void> {}",
      "```",
    ].join("\n");

    expect(extractReasoning(response)).toBe(
      "The function is missing a return type annotation.\nI need to add Promise<void> as the return type.",
    );
  });

  it("returns null when no reasoning tags are present", () => {
    const response = [
      "```typescript",
      "export async function fetchUser(): Promise<void> {}",
      "```",
    ].join("\n");

    expect(extractReasoning(response)).toBeNull();
  });
});
