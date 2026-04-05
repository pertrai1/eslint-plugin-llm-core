import { describe, expect, it } from "vitest";
import explicitExportTypes from "../../src/rules/explicit-export-types";
import maxFileLength from "../../src/rules/max-file-length";
import maxFunctionLength from "../../src/rules/max-function-length";
import namingConventions from "../../src/rules/naming-conventions";
import noAsyncArrayCallbacks from "../../src/rules/no-async-array-callbacks";
import noEmptyCatch from "../../src/rules/no-empty-catch";

describe("rule message guidance", () => {
  it("keeps exported-type guidance concrete and naming guidance accurate", () => {
    expect(explicitExportTypes.meta.messages?.missingReturnType).toBe(
      [
        "Exported function '{{ fn }}' is missing an explicit return type annotation.",
        "",
        "Why: Exported function return types should be declared in the contract, not inferred from the implementation.",
        "",
        "How to fix:",
        "  Before: export function processOrder(order: Order) { ... }",
        "  After:  export function processOrder(order: Order): ProcessedOrder { ... }",
      ].join("\n"),
    );

    expect(namingConventions.meta.messages?.missingBasePrefix).toBe(
      [
        "Abstract class '{{ className }}' must use the 'Base' prefix (e.g., 'Base{{ className }}').",
        "",
        "Why: The prefix makes abstract base classes recognizable during navigation and review.",
        "",
        "How to fix:",
        "  Before: abstract class {{ className }} { ... }",
        "  After:  abstract class Base{{ className }} { ... }",
      ].join("\n"),
    );
  });

  it("uses a concrete rewrite template for repair-oriented rules", () => {
    expect(noAsyncArrayCallbacks.meta.messages?.noAsyncMapCallback).toContain(
      "Before: const results = items.map(async (item) => processItem(item));",
    );
    expect(noAsyncArrayCallbacks.meta.messages?.noAsyncMapCallback).toContain(
      "After:  const results = await Promise.all(items.map(async (item) => processItem(item)));",
    );

    expect(noEmptyCatch.meta.messages?.noEmptyCatch).toContain(
      "Choose one explicit outcome:",
    );
    expect(noEmptyCatch.meta.messages?.noEmptyCatch).toContain(
      "Before: catch (error) {",
    );

    expect(maxFileLength.meta.messages?.maxFileLength).toContain(
      "Before: order-service.ts contains types, validation, formatting, and persistence.",
    );
    expect(maxFileLength.meta.messages?.maxFileLength).toContain(
      "After:  order-service.ts keeps orchestration; move validation to order-validation.ts",
    );

    expect(maxFunctionLength.meta.messages?.maxFunctionLength).toContain(
      "Before: function processOrder(order) { validate(order); calculate(order); save(order); }",
    );
    expect(maxFunctionLength.meta.messages?.maxFunctionLength).toContain(
      "After:  function processOrder(order) {",
    );
  });
});
