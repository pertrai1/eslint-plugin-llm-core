import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/bad-min-max-func";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("bad-min-max-func", rule, {
  valid: [
    // Correct clamp order: raise to the lower bound, then cap at the upper bound.
    `const clamped = Math.min(Math.max(value, 0), 100);`,
    `const clamped = Math.max(Math.min(value, 100), 0);`,

    // Equal bounds intentionally collapse to that one value.
    `const fixed = Math.min(Math.max(value, 100), 100);`,

    // Non-numeric or computed bounds are outside the narrow syntactic scope.
    `const clamped = Math.min(Math.max(value, lower), upper);`,
    `const clamped = Math.min(Math.max(value, getLower()), 100);`,

    // Non-Math helper functions may implement different semantics.
    `const clamped = min(max(100, value), 0);`,
  ],

  invalid: [
    // The inner max always returns at least 100, then the outer min caps it to 0.
    {
      code: `const clamped = Math.min(Math.max(100, value), 0);`,
      errors: [{ messageId: "badMinMaxFunc" as const }],
    },

    // The same impossible clamp can appear with the value first in the nested call.
    {
      code: `const clamped = Math.min(Math.max(value, 100), 0);`,
      errors: [{ messageId: "badMinMaxFunc" as const }],
    },

    // Inverted max/min order always returns the upper numeric literal.
    {
      code: `const clamped = Math.max(Math.min(value, 0), 100);`,
      errors: [{ messageId: "badMinMaxFunc" as const }],
    },

    // Negative and decimal literal bounds should be handled too.
    {
      code: `const clamped = Math.max(Math.min(value, -1.5), 0);`,
      errors: [{ messageId: "badMinMaxFunc" as const }],
    },
  ],
});
