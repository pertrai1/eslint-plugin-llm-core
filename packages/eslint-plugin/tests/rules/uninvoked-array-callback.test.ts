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

    // Single non-length arguments create single-element arrays, not sparse arrays.
    `Array("x").map((value) => value.toUpperCase());`,
    `Array(true).map((value) => value);`,
    `Array(null).map((value) => value);`,
    `Array(1n).map((value) => value);`,
    `Array({ id: "row" }).map((value) => value.id);`,
    `Array(() => createRow()).map((factory) => factory());`,
    `Array(3.14).map((value) => value);`,
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

    // Partial fills leave holes outside the filled range.
    {
      code: `new Array(5).fill(null, 1, 3).map((_, index) => createRow(index));`,
      errors: [{ messageId: "uninvokedArrayCallback" as const }],
    },
  ],
});
