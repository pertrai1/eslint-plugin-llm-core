import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/uninvoked-array-callback";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("uninvoked-array-callback", rule, {
  valid: [
    // Dense arrays invoke callbacks for every present element.
    `[1, 2, 3].map((value) => value * 2);`,

    // Array.from creates present elements and invokes the mapping callback.
    `Array.from({ length: 5 }, (_, index) => createRow(index));`,

    // Filling the sparse array first makes callbacks run for each element.
    `new Array(5).fill(null).map((_, index) => createRow(index));`,

    // Spread materializes undefined elements before mapping.
    `[...new Array(5)].map((_, index) => createRow(index));`,

    // Array constructors with explicit elements are not sparse-length constructors.
    `new Array("a", "b").map((value) => value.toUpperCase());`,

    // Non-array methods with the same name are outside this rule's narrow scope.
    `collection.map((item) => item.value);`,
  ],

  invalid: [
    // Sparse length-only arrays skip map callbacks.
    {
      code: `const rows = new Array(5).map((_, index) => createRow(index));`,
      errors: [{ messageId: "uninvokedArrayCallback" as const }],
    },

    // Array(length) has the same sparse-array behavior as new Array(length).
    {
      code: `const rows = Array(5).map((_, index) => createRow(index));`,
      errors: [{ messageId: "uninvokedArrayCallback" as const }],
    },

    // Array methods that depend on callback invocation also silently skip holes.
    {
      code: `new Array(count).forEach((_, index) => save(index));`,
      errors: [{ messageId: "uninvokedArrayCallback" as const }],
    },

    // Chaining through another skipped callback remains sparse and still wrong.
    {
      code: `new Array(3).map((_, index) => index).filter((index) => index > 0);`,
      errors: [{ messageId: "uninvokedArrayCallback" as const }],
    },
  ],
});
