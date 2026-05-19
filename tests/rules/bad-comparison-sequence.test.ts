import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/bad-comparison-sequence";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("bad-comparison-sequence", rule, {
  valid: [
    // Correct range checks compare the value in two explicit comparisons.
    `if (0 <= ratio && ratio <= 1) { accept(ratio); }`,

    // A comparison result can intentionally be compared to a boolean.
    `const isIncreasing = (start < end) === true;`,
    `const isDifferent = (left !== right) !== false;`,

    // Non-comparison arithmetic chains are outside this rule's narrow scope.
    `const total = a + b + c;`,

    // A comparison can be used directly as a condition.
    `if (score > threshold) { award(); }`,
  ],

  invalid: [
    // Mathematical range notation does not work in JavaScript/TypeScript.
    {
      code: `if (0 <= ratio <= 1) { accept(ratio); }`,
      errors: [{ messageId: "badComparisonSequence" as const }],
    },

    // Strict inequalities have the same boolean-to-number coercion problem.
    {
      code: `const inside = min < value < max;`,
      errors: [{ messageId: "badComparisonSequence" as const }],
    },

    // Equality chains compare a boolean result to the final operand.
    {
      code: `if (a === b === c) { sync(); }`,
      errors: [{ messageId: "badComparisonSequence" as const }],
    },

    // Parentheses do not fix the semantics; they make the left comparison explicit.
    {
      code: `const isSmall = (0 < count) < 10;`,
      errors: [{ messageId: "badComparisonSequence" as const }],
    },
  ],
});
