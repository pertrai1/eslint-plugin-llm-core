import { describe, expect, it } from "vitest";
import explicitExportTypes from "../../src/rules/explicit-export-types";
import maxComplexity from "../../src/rules/max-complexity";
import maxFileLength from "../../src/rules/max-file-length";
import maxFunctionLength from "../../src/rules/max-function-length";
import namingConventions from "../../src/rules/naming-conventions";
import noAsyncArrayCallbacks from "../../src/rules/no-async-array-callbacks";
import noEmptyCatch from "../../src/rules/no-empty-catch";
import preferUnknownInCatch from "../../src/rules/prefer-unknown-in-catch";

function expectSingleWhyLine(message: string): void {
  const whyLines = message
    .split("\n")
    .filter((line) => line.startsWith("Why:"));
  expect(whyLines).toHaveLength(1);
}

function expectTemplateShape(message: string): void {
  expect(message).toContain("How to fix:");
  const hasBefore = message.includes("Before:");
  const hasAfter = message.includes("After:");
  const hasChoose = message.includes("Choose ");

  if (hasBefore || hasAfter) {
    expect(hasBefore).toBe(true);
    expect(hasAfter).toBe(true);
  }

  expect(hasBefore || hasAfter || hasChoose).toBe(true);
}

describe("rule message guidance", () => {
  it("keeps exported-type guidance concrete and naming guidance accurate", () => {
    const missingParamType =
      explicitExportTypes.meta.messages?.missingParamType ?? "";
    const missingReturnType =
      explicitExportTypes.meta.messages?.missingReturnType ?? "";
    const missingBasePrefix =
      namingConventions.meta.messages?.missingBasePrefix ?? "";
    const missingErrorSuffix =
      namingConventions.meta.messages?.missingErrorSuffix ?? "";

    expectSingleWhyLine(missingParamType);
    expectTemplateShape(missingParamType);
    expect(missingParamType).toContain(
      "Before: export function processOrder(order) { ... }",
    );
    expect(missingParamType).toContain(
      "After:  export function processOrder(order: Order) { ... }",
    );
    expect(missingParamType).not.toContain("ProcessedOrder");

    expectSingleWhyLine(missingReturnType);
    expectTemplateShape(missingReturnType);
    expect(missingReturnType).toContain(
      "Before: export function processOrder(order: Order) { ... }",
    );
    expect(missingReturnType).toContain(
      "After:  export function processOrder(order: Order): ProcessedOrder { ... }",
    );

    expectSingleWhyLine(missingBasePrefix);
    expectTemplateShape(missingBasePrefix);
    expect(missingBasePrefix).toContain(
      "Why: The prefix makes abstract base classes recognizable during navigation and review.",
    );
    expectSingleWhyLine(missingErrorSuffix);
    expectTemplateShape(missingErrorSuffix);
    expect(missingErrorSuffix).toContain(
      "Why: The suffix makes error types recognizable in catch blocks, logs, and API boundaries.",
    );
  });

  it("uses a concrete rewrite template for repair-oriented rules", () => {
    const noAsyncArrayCallback =
      noAsyncArrayCallbacks.meta.messages?.noAsyncArrayCallback ?? "";
    const noAsyncMapCallback =
      noAsyncArrayCallbacks.meta.messages?.noAsyncMapCallback ?? "";
    const noEmptyCatchMessage = noEmptyCatch.meta.messages?.noEmptyCatch ?? "";
    const maxFileLengthMessage =
      maxFileLength.meta.messages?.maxFileLength ?? "";
    const maxComplexityMessage =
      maxComplexity.meta.messages?.maxComplexity ?? "";
    const maxFunctionLengthMessage =
      maxFunctionLength.meta.messages?.maxFunctionLength ?? "";

    expectSingleWhyLine(noAsyncArrayCallback);
    expectTemplateShape(noAsyncArrayCallback);
    expect(noAsyncArrayCallback).toContain(
      "Choose the rewrite that preserves the original method semantics:",
    );
    expect(noAsyncArrayCallback).toContain(
      "forEach: for (const item of items) { await processItem(item); }",
    );
    expect(noAsyncArrayCallback).toContain(
      "reduce: let acc = initial; for (const item of items) { acc = await step(acc, item); }",
    );
    expect(noAsyncArrayCallback).toContain(
      "Before: const matches = await Promise.all(items.map(async (item) => isMatch(item)));",
    );
    expect(noAsyncArrayCallback).toContain(
      "After:  const filtered = items.filter((_, index) => matches[index]);",
    );

    expectSingleWhyLine(noAsyncMapCallback);
    expectTemplateShape(noAsyncMapCallback);
    expect(noAsyncMapCallback).toContain(
      "Before: const results = items.map(async (item) => processItem(item));",
    );
    expect(noAsyncMapCallback).toContain(
      "After:  const results = await Promise.all(items.map(async (item) => processItem(item)));",
    );

    expectSingleWhyLine(noEmptyCatchMessage);
    expectTemplateShape(noEmptyCatchMessage);
    expect(noEmptyCatchMessage).toContain("Choose one explicit outcome:");
    expect(noEmptyCatchMessage).toContain("Before: catch (error) {");
    expect(noEmptyCatchMessage).toContain(
      "A comment alone does not satisfy this rule.",
    );

    expectSingleWhyLine(maxFileLengthMessage);
    expectTemplateShape(maxFileLengthMessage);
    expect(maxFileLengthMessage).toContain(
      "Before: order-service.ts contains types, validation, formatting, and persistence.",
    );
    expect(maxFileLengthMessage).toContain(
      "After:  order-service.ts keeps orchestration; move validation to order-validation.ts",
    );

    expectSingleWhyLine(maxComplexityMessage);
    expectTemplateShape(maxComplexityMessage);
    expect(maxComplexityMessage).toContain(
      "Before: if (type === 'a') return 1; else if (type === 'b') return 2; else if (type === 'c') return 3;",
    );
    expect(maxComplexityMessage).toContain(
      "After:  const VALUES: Record<string, number> = { a: 1, b: 2, c: 3 };",
    );
    expect(maxComplexityMessage).toContain(
      "function getValue(type: string): number { return VALUES[type] ?? 0; }",
    );

    expectSingleWhyLine(maxFunctionLengthMessage);
    expectTemplateShape(maxFunctionLengthMessage);
    expect(maxFunctionLengthMessage).toContain(
      "Before: function processOrder(order) {",
    );
    expect(maxFunctionLengthMessage).toContain(
      "const sanitizedEmail = order.email.trim();",
    );
    expect(maxFunctionLengthMessage).toContain(
      "After:  function processOrder(order) {",
    );
    expect(maxFunctionLengthMessage).toContain(
      "return saveOrder(order, total, sanitizedEmail);",
    );
    expect(maxFunctionLengthMessage).not.toContain(
      "And extract the validation and normalization details into helpers.",
    );
  });

  it("prefer-unknown-in-catch shows custom property narrowing without as any", () => {
    const message =
      preferUnknownInCatch.meta.messages?.preferUnknownInCatch ?? "";

    expectSingleWhyLine(message);
    expectTemplateShape(message);

    // Must show the 'prop' in error narrowing pattern for custom properties
    expect(message).toContain("'code' in error");
    // "After:" sections (including continuation lines) must not use "as any"
    const lines = message.split("\n");
    const afterSections: string[] = [];
    let current: string[] = [];
    for (const line of lines) {
      if (line.trimStart().startsWith("After:")) {
        if (current.length > 0) afterSections.push(current.join("\n"));
        current = [line];
      } else if (current.length > 0) {
        if (line.trim() === "" || line.trimStart().startsWith("Before:")) {
          afterSections.push(current.join("\n"));
          current = [];
        } else {
          current.push(line);
        }
      }
    }
    if (current.length > 0) afterSections.push(current.join("\n"));
    expect(afterSections.length).toBeGreaterThan(0);
    for (const section of afterSections) {
      expect(section).not.toContain("as any");
    }
  });
});
