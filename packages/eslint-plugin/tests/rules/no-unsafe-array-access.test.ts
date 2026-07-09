import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-unsafe-array-access";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-unsafe-array-access", rule, {
  valid: [
    // A positive length guard proves the first element exists in the guarded block.
    `function getFirst(items: string[]) {
      if (items.length > 0) {
        return items[0];
      }
      return undefined;
    }`,

    // Truthy length checks are a common non-empty guard.
    `function getHead(results: Result[]) {
      if (results.length) {
        const [head, ...tail] = results;
        return { head, tail };
      }
      return null;
    }`,

    // Early exits that rule out the empty case guard later access in the same block.
    `function getLast(items: string[]) {
      if (items.length === 0) return undefined;
      return items[items.length - 1];
    }`,

    // Early exits in an ancestor block guard nested statements in the same function.
    `function getFirst(items: string[], shouldRead: boolean) {
      if (items.length === 0) return undefined;
      if (shouldRead) {
        return items[0];
      }
      return undefined;
    }`,

    // Nested exit paths can prove the empty branch does not continue.
    `function getFirst(items: string[], shouldThrow: boolean) {
      if (items.length === 0) {
        if (shouldThrow) {
          throw new Error("Expected at least one item");
        }
        return undefined;
      }
      return items[0];
    }`,

    // Switch branches that all exit can also prove the empty branch does not continue.
    `function getFirst(items: string[], mode: "throw" | "return") {
      if (items.length === 0) {
        switch (mode) {
          case "throw":
            throw new Error("Expected at least one item");
          default:
            return undefined;
        }
      }
      return items[0];
    }`,

    // Grouped switch labels share the next non-empty consequent.
    `function getFirst(items: string[], mode: "throw" | "return" | "skip") {
      if (items.length === 0) {
        switch (mode) {
          case "throw":
          case "skip":
            throw new Error("Expected at least one item");
          default:
            return undefined;
        }
      }
      return items[0];
    }`,

    // Ternary positive branches can guard indexed access locally.
    `function getFirst(items: string[]) {
      return items.length !== 0 ? items[0] : undefined;
    }`,

    // Logical expressions can guard the right-hand side locally.
    `function getFirst(items: string[]) {
      return items.length && items[0];
    }`,

    // Destructuring defaults make the empty-array case explicit.
    `function getFirst(items: string[], fallback: string) {
      const [first = fallback] = items;
      return first;
    }`,

    // Non-leading destructuring that does not read a required element is ignored.
    `function clone(items: string[]) {
      const [...copy] = items;
      return copy;
    }`,

    // Optional element access intentionally returns undefined when no element exists.
    `function maybeFirst(items?: string[]) {
      return items?.[0];
    }`,

    // Dynamic indexes are outside this rule's narrow first/last-element scope.
    `function getAt(items: string[], index: number) {
      return items[index];
    }`,

    // Fixed array literals are statically non-empty here.
    `const first = ["fallback"][0];`,

    // Reversed comparisons are also valid non-empty guards.
    `function getFirst(items: string[]) {
      if (0 < items.length) {
        return items[0];
      }
      return undefined;
    }`,

    // Greater-than-or-equal guards can prove at least one element exists.
    `function getFirst(items: string[]) {
      if (1 <= items.length) {
        const [first] = items;
        return first;
      }
      return undefined;
    }`,

    // Computed length properties are still length checks.
    `function getFirst(items: string[]) {
      if (items["length"] >= 1) {
        return items[0];
      }
      return undefined;
    }`,

    // Negated truthy guards can protect later access after an early throw.
    `function getFirst(items: string[]) {
      if (!items.length) {
        throw new Error("Expected at least one item");
      }
      return (items as string[])[0];
    }`,

    // Less-than-one early returns also rule out empty arrays.
    `function getFirst(items: string[]) {
      if (items.length < 1) {
        return undefined;
      }
      const [first] = items;
      return first;
    }`,

    // Empty tests can guard the alternate ternary branch.
    `function getFirst(items: string[]) {
      return items.length === 0 ? undefined : items[0];
    }`,

    // Empty tests can guard the right-hand side of an OR expression.
    `function getFirst(items: string[]) {
      return items.length === 0 || items[0];
    }`,

    // A positive guard with an exiting alternate protects following statements.
    `function getFirst(items: string[]) {
      if (items.length > 0) {
        logReady(items.length);
      } else {
        return undefined;
      }
      return items[0];
    }`,

    // Empty guards protect the explicit else branch.
    `function getFirst(items: string[]) {
      if (items.length === 0) {
        return undefined;
      } else {
        return items[0];
      }
    }`,

    // Reversed empty checks can guard following statements.
    `function getFirst(items: string[]) {
      if (0 === items.length) {
        return undefined;
      }
      return items[0];
    }`,

    // Reversed less-than-one checks can guard following statements.
    `function getFirst(items: string[]) {
      if (1 > items.length) {
        return undefined;
      }
      return items[0];
    }`,

    // Empty destructuring and non-identifier initializers are outside this rule.
    `function ignoreEmpty() {
      const [] = getItems();
    }`,
  ],

  invalid: [
    // Direct first-element access without a non-empty guard.
    {
      code: `function getFirst(items: string[]) {
        return items[0];
      }`,
      errors: [{ messageId: "unsafeArrayAccess" as const }],
    },

    // Last-element access is unsafe when the array may be empty.
    {
      code: `function getLast(items: string[]) {
        return items[items.length - 1];
      }`,
      errors: [{ messageId: "unsafeArrayAccess" as const }],
    },

    // Destructuring the first element also reads undefined from empty arrays.
    {
      code: `function split(results: Result[]) {
        const [head, ...tail] = results;
        return { head, tail };
      }`,
      errors: [{ messageId: "unsafeArrayAccess" as const }],
    },

    // Checks after the access do not guard the access.
    {
      code: `function getFirst(items: string[]) {
        const first = items[0];
        if (items.length === 0) return undefined;
        return first;
      }`,
      errors: [{ messageId: "unsafeArrayAccess" as const }],
    },

    // TypeScript wrappers should not hide the unsafe access pattern.
    {
      code: `function getFirst(items?: string[]) {
        return items![0];
      }`,
      errors: [{ messageId: "unsafeArrayAccess" as const }],
    },

    // Type assertions around the array object still read the first element.
    {
      code: `function getFirst(items: unknown) {
        return (items as string[])[0];
      }`,
      errors: [{ messageId: "unsafeArrayAccess" as const }],
    },

    // Satisfies wrappers should not hide the unsafe access pattern.
    {
      code: `function getFirst(items: string[]) {
        return (items satisfies string[])[0];
      }`,
      errors: [{ messageId: "unsafeArrayAccess" as const }],
    },

    // Empty checks for a different array do not guard this access.
    {
      code: `function getFirst(items: string[], fallbackItems: string[]) {
        if (fallbackItems.length === 0) return undefined;
        return items[0];
      }`,
      errors: [{ messageId: "unsafeArrayAccess" as const }],
    },

    // Positive control-flow guards do not apply inside a nested closure.
    {
      code: `function createGetter(items: string[]) {
        if (items.length > 0) {
          return () => items[0];
        }
        return () => undefined;
      }`,
      errors: [{ messageId: "unsafeArrayAccess" as const }],
    },

    // Earlier exits in the outer function do not guard deferred closure execution.
    {
      code: `function createGetter(items: string[]) {
        if (items.length === 0) return () => undefined;
        return () => items[0];
      }`,
      errors: [{ messageId: "unsafeArrayAccess" as const }],
    },
  ],
});
