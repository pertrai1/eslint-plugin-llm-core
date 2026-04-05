import { describe, expect, it } from "vitest";
import explicitExportTypes from "../../src/rules/explicit-export-types";
import namingConventions from "../../src/rules/naming-conventions";

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
});
