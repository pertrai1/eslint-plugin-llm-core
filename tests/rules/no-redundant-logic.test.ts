import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-redundant-logic";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-redundant-logic", rule, {
  valid: [
    // Pattern 1: direct boolean expressions — no comparison needed
    `if (isActive) {}`,
    `if (!isValid) {}`,
    `if (!hasPermission) {}`,
    `while (running) {}`,

    // Pattern 1: loose equality is NOT flagged
    `if (value == true) {}`,
    `if (value == false) {}`,

    // Pattern 1: non-boolean literals — not flagged
    `if (x === 1) {}`,
    `if (y === "active") {}`,

    // Pattern 1: comparisons not using === or !== — not flagged
    `if (x > true) {}`,
  ],

  invalid: [
    // Pattern 1: x === true
    {
      code: `if (isActive === true) {}`,
      errors: [{ messageId: "redundantBooleanComparison" as const }],
    },

    // Pattern 1: x !== true
    {
      code: `if (isValid !== true) {}`,
      errors: [{ messageId: "redundantBooleanComparison" as const }],
    },

    // Pattern 1: x === false
    {
      code: `if (hasPermission === false) {}`,
      errors: [{ messageId: "redundantBooleanComparison" as const }],
    },

    // Pattern 1: x !== false
    {
      code: `while (running !== false) {}`,
      errors: [{ messageId: "redundantBooleanComparison" as const }],
    },

    // Pattern 1: boolean literal on the left side
    {
      code: `if (true === isActive) {}`,
      errors: [{ messageId: "redundantBooleanComparison" as const }],
    },

    // Pattern 1: false !== x
    {
      code: `if (false !== isEnabled) {}`,
      errors: [{ messageId: "redundantBooleanComparison" as const }],
    },

    // Pattern 1: complex expression on one side
    {
      code: `if ((a && b) === false) {}`,
      errors: [{ messageId: "redundantBooleanComparison" as const }],
    },
  ],
});
