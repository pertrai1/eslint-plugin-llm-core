import { describe, expect, it } from "vitest";
import explicitExportTypes from "../../src/rules/explicit-export-types";
import maxFileLength from "../../src/rules/max-file-length";
import maxFunctionLength from "../../src/rules/max-function-length";
import namingConventions from "../../src/rules/naming-conventions";
import noAsyncArrayCallbacks from "../../src/rules/no-async-array-callbacks";
import noEmptyCatch from "../../src/rules/no-empty-catch";

function expectSingleWhyLine(message: string): void {
  const whyLines = message
    .split("\n")
    .filter((line) => line.startsWith("Why:"));
  expect(whyLines).toHaveLength(1);
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
    expect(missingParamType).toContain(
      "Before: export function processOrder(order) { ... }",
    );
    expect(missingParamType).toContain(
      "After:  export function processOrder(order: Order) { ... }",
    );
    expect(missingParamType).not.toContain("ProcessedOrder");

    expectSingleWhyLine(missingReturnType);
    expect(missingReturnType).toContain(
      "Before: export function processOrder(order: Order) { ... }",
    );
    expect(missingReturnType).toContain(
      "After:  export function processOrder(order: Order): ProcessedOrder { ... }",
    );

    expectSingleWhyLine(missingBasePrefix);
    expect(missingBasePrefix).toContain(
      "Why: The prefix makes abstract base classes recognizable during navigation and review.",
    );
    expectSingleWhyLine(missingErrorSuffix);
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
    const maxFunctionLengthMessage =
      maxFunctionLength.meta.messages?.maxFunctionLength ?? "";

    expectSingleWhyLine(noAsyncArrayCallback);
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
      "filter/some/every/flatMap: await the async work first, then run the synchronous array method on resolved values.",
    );

    expectSingleWhyLine(noAsyncMapCallback);
    expect(noAsyncMapCallback).toContain(
      "Before: const results = items.map(async (item) => processItem(item));",
    );
    expect(noAsyncMapCallback).toContain(
      "After:  const results = await Promise.all(items.map(async (item) => processItem(item)));",
    );

    expectSingleWhyLine(noEmptyCatchMessage);
    expect(noEmptyCatchMessage).toContain("Choose one explicit outcome:");
    expect(noEmptyCatchMessage).toContain("Before: catch (error) {");
    expect(noEmptyCatchMessage).toContain(
      "A comment alone does not satisfy this rule.",
    );

    expectSingleWhyLine(maxFileLengthMessage);
    expect(maxFileLengthMessage).toContain(
      "Before: order-service.ts contains types, validation, formatting, and persistence.",
    );
    expect(maxFileLengthMessage).toContain(
      "After:  order-service.ts keeps orchestration; move validation to order-validation.ts",
    );

    expectSingleWhyLine(maxFunctionLengthMessage);
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
  });
});
