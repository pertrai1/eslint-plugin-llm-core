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

    // Pattern 2: no else block — not flagged
    `function f() { if (cond) { return 1; } doSomething(); }`,

    // Pattern 2: else-if chain — not flagged
    `function f() { if (a) { return 1; } else if (b) { return 2; } }`,

    // Pattern 2: if consequent does NOT end with return/throw — not flagged
    `function f() { if (cond) { doWork(); } else { return 1; } }`,

    // Pattern 2: else has more than one statement — not flagged
    `function f() { if (cond) { return 1; } else { doWork(); return 2; } }`,
  ],

  invalid: [
    // Pattern 1: x === true
    {
      code: `if (isActive === true) {}`,
      errors: [
        {
          messageId: "redundantBooleanComparison" as const,
          suggestions: [
            {
              messageId: "redundantBooleanComparisonSuggest" as const,
              output: `if (isActive) {}`,
            },
          ],
        },
      ],
    },

    // Pattern 1: x !== true
    {
      code: `if (isValid !== true) {}`,
      errors: [
        {
          messageId: "redundantBooleanComparison" as const,
          suggestions: [
            {
              messageId: "redundantBooleanComparisonSuggest" as const,
              output: `if (!isValid) {}`,
            },
          ],
        },
      ],
    },

    // Pattern 1: x === false
    {
      code: `if (hasPermission === false) {}`,
      errors: [
        {
          messageId: "redundantBooleanComparison" as const,
          suggestions: [
            {
              messageId: "redundantBooleanComparisonSuggest" as const,
              output: `if (!hasPermission) {}`,
            },
          ],
        },
      ],
    },

    // Pattern 1: x !== false
    {
      code: `while (running !== false) {}`,
      errors: [
        {
          messageId: "redundantBooleanComparison" as const,
          suggestions: [
            {
              messageId: "redundantBooleanComparisonSuggest" as const,
              output: `while (running) {}`,
            },
          ],
        },
      ],
    },

    // Pattern 1: boolean literal on the left side
    {
      code: `if (true === isActive) {}`,
      errors: [
        {
          messageId: "redundantBooleanComparison" as const,
          suggestions: [
            {
              messageId: "redundantBooleanComparisonSuggest" as const,
              output: `if (isActive) {}`,
            },
          ],
        },
      ],
    },

    // Pattern 1: false !== x
    {
      code: `if (false !== isEnabled) {}`,
      errors: [
        {
          messageId: "redundantBooleanComparison" as const,
          suggestions: [
            {
              messageId: "redundantBooleanComparisonSuggest" as const,
              output: `if (isEnabled) {}`,
            },
          ],
        },
      ],
    },

    // Pattern 1: complex expression needs parens when negating
    {
      code: `if ((a && b) === false) {}`,
      errors: [
        {
          messageId: "redundantBooleanComparison" as const,
          suggestions: [
            {
              messageId: "redundantBooleanComparisonSuggest" as const,
              output: `if (!(a && b)) {}`,
            },
          ],
        },
      ],
    },

    // Pattern 2: if block ends with return, else block has single return
    {
      code: `function f(x) { if (x) { return 1; } else { return 2; } }`,
      errors: [{ messageId: "unnecessaryElse" as const }],
    },

    // Pattern 2: if block ends with throw, else block has single return
    {
      code: `function f(x) { if (!x) { throw new Error(); } else { return 2; } }`,
      errors: [{ messageId: "unnecessaryElse" as const }],
    },

    // Pattern 2: multiline — if/else with early return
    {
      code: [
        "function getLabel(status) {",
        "  if (status === 'active') {",
        "    return 'Active';",
        "  } else {",
        "    return 'Inactive';",
        "  }",
        "}",
      ].join("\n"),
      errors: [{ messageId: "unnecessaryElse" as const }],
    },

    // Pattern 2: else block with single throw
    {
      code: `function validate(x) { if (x > 0) { return x; } else { throw new Error('invalid'); } }`,
      errors: [{ messageId: "unnecessaryElse" as const }],
    },
  ],
});
