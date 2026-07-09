import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-incorrect-sort";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-incorrect-sort", rule, {
  valid: [
    // Sort with arrow function comparator
    "const sorted = nums.sort((a, b) => a - b);",
    // Sort with function expression comparator
    "nums.sort(function(a, b) { return a - b; });",
    // Sort with named comparator
    "nums.sort(compareFn);",
    // Sort with method chain that has comparator
    "items.sort(byPriority).map(normalize);",
    // Sort on string array (still needs comparator for non-trivial cases, but valid)
    "names.sort((a, b) => a.localeCompare(b));",
    // Sort with inline callback that returns number
    "arr.sort((x, y) => x.id - y.id);",
    // Not a sort call — different method
    "nums.map(n => n * 2);",
    // Sort with comparator referencing outer variable
    "arr.sort((a, b) => a[key].localeCompare(b[key]));",
    // Optional chaining — still has comparator
    "items?.sort((a, b) => a - b);",
    // Sort on result of another expression with comparator
    "getItems().sort((a, b) => a.name.localeCompare(b.name));",
    // TypedArray.sort() uses numeric comparison by default — not a false positive
    "new Int32Array([10, 2, 1]).sort();",
    "new Float64Array(data).sort();",
    "new Uint8Array(bytes).sort();",
  ],

  invalid: [
    // Basic .sort() with no arguments — the classic LLM mistake
    {
      code: "nums.sort();",
      errors: [{ messageId: "noIncorrectSort" }],
    },
    // .sort() on an array literal
    {
      code: "[10, 2, 1].sort();",
      errors: [{ messageId: "noIncorrectSort" }],
    },
    // .sort() on a variable
    {
      code: "const sorted = items.sort();",
      errors: [{ messageId: "noIncorrectSort" }],
    },
    // .sort() chained after another method
    {
      code: "getItems().sort();",
      errors: [{ messageId: "noIncorrectSort" }],
    },
    // Optional chaining without comparator
    {
      code: "items?.sort();",
      errors: [{ messageId: "noIncorrectSort" }],
    },
    // .sort() with undefined as argument (not a valid comparator)
    {
      code: "arr.sort(undefined);",
      errors: [{ messageId: "noIncorrectSort" }],
    },
    // .sort(void 0) is semantically identical to .sort(undefined)
    {
      code: "arr.sort(void 0);",
      errors: [{ messageId: "noIncorrectSort" }],
    },
  ],
});
