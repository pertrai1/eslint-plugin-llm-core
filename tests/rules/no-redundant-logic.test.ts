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

    // Pattern 3: ternary with non-boolean values — not flagged
    `const x = cond ? "yes" : "no";`,
    `const y = a ? 1 : 0;`,
    `const z = check ? value : null;`,

    // Pattern 3: ternary with only one boolean literal — not flagged
    `const x = cond ? true : "no";`,
    `const y = cond ? false : 0;`,

    // Pattern 4: if/else with additional logic — not flagged by Pattern 4
    // (else also has multiple stmts, so not flagged by Pattern 2 either)
    `if (cond) { doWork(); return true; } else { doMore(); return false; }`,

    // Pattern 4: if without else — not flagged
    `if (cond) { return true; }`,

    // Pattern 4: branches with different assignment targets — not flagged
    `if (cond) { x = true; } else { y = false; }`,

    // Pattern 3: same boolean on both sides — not flagged (not redundant, just pointless)
    `const x = cond ? true : true;`,
    `const y = cond ? false : false;`,

    // Pattern 4: same return value — Pattern 4 skips, but Pattern 2 still fires (tested in invalid)

    // Pattern 4: same assignment value on both sides — not flagged
    `if (cond) { x = false; } else { x = false; }`,

    // Pattern 2: outer if does not end with return — outer else not flagged
    `function f() { if (a) { doWork(); } else { doOther(); } }`,
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
      errors: [
        {
          messageId: "unnecessaryElse" as const,
          suggestions: [
            {
              messageId: "unnecessaryElseSuggest" as const,
              output: `function f(x) { if (x) { return 1; }\n                return 2; }`,
            },
          ],
        },
      ],
    },

    // Pattern 2: if block ends with throw, else block has single return
    {
      code: `function f(x) { if (!x) { throw new Error(); } else { return 2; } }`,
      errors: [
        {
          messageId: "unnecessaryElse" as const,
          suggestions: [
            {
              messageId: "unnecessaryElseSuggest" as const,
              output: `function f(x) { if (!x) { throw new Error(); }\n                return 2; }`,
            },
          ],
        },
      ],
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
      errors: [
        {
          messageId: "unnecessaryElse" as const,
          suggestions: [
            {
              messageId: "unnecessaryElseSuggest" as const,
              output: [
                "function getLabel(status) {",
                "  if (status === 'active') {",
                "    return 'Active';",
                "  }",
                "  return 'Inactive';",
                "}",
              ].join("\n"),
            },
          ],
        },
      ],
    },

    // Pattern 2: else block with single throw
    {
      code: `function validate(x) { if (x > 0) { return x; } else { throw new Error('invalid'); } }`,
      errors: [
        {
          messageId: "unnecessaryElse" as const,
          suggestions: [
            {
              messageId: "unnecessaryElseSuggest" as const,
              output: `function validate(x) { if (x > 0) { return x; }\n                       throw new Error('invalid'); }`,
            },
          ],
        },
      ],
    },

    // Pattern 3: condition ? true : false
    {
      code: `const isEligible = age >= 18 ? true : false;`,
      errors: [
        {
          messageId: "ternaryBooleanLiteral" as const,
          suggestions: [
            {
              messageId: "ternaryBooleanLiteralSuggest" as const,
              output: `const isEligible = age >= 18;`,
            },
          ],
        },
      ],
    },

    // Pattern 3: condition ? false : true
    {
      code: `const isBlocked = isAdmin ? false : true;`,
      errors: [
        {
          messageId: "ternaryBooleanLiteral" as const,
          suggestions: [
            {
              messageId: "ternaryBooleanLiteralSuggest" as const,
              output: `const isBlocked = !isAdmin;`,
            },
          ],
        },
      ],
    },

    // Pattern 3: complex condition — no negation needed
    {
      code: `const hasAccess = user.role === "admin" ? true : false;`,
      errors: [
        {
          messageId: "ternaryBooleanLiteral" as const,
          suggestions: [
            {
              messageId: "ternaryBooleanLiteralSuggest" as const,
              output: `const hasAccess = user.role === "admin";`,
            },
          ],
        },
      ],
    },

    // Pattern 4: if/else returning boolean literals
    {
      code: [
        "if (items.length > 0) {",
        "  return true;",
        "} else {",
        "  return false;",
        "}",
      ].join("\n"),
      errors: [
        {
          messageId: "ifElseBooleanLiteral" as const,
          suggestions: [
            {
              messageId: "ifElseBooleanLiteralSuggest" as const,
              output: `return items.length > 0;`,
            },
          ],
        },
      ],
    },

    // Pattern 4: if/else assigning boolean literals
    {
      code: [
        "if (age >= 18) {",
        "  isValid = true;",
        "} else {",
        "  isValid = false;",
        "}",
      ].join("\n"),
      errors: [
        {
          messageId: "ifElseBooleanLiteral" as const,
          suggestions: [
            {
              messageId: "ifElseBooleanLiteralSuggest" as const,
              output: `isValid = age >= 18;`,
            },
          ],
        },
      ],
    },

    // Pattern 4: inverse — if false else true (negate condition)
    {
      code: [
        "if (hasErrors) {",
        "  isOk = false;",
        "} else {",
        "  isOk = true;",
        "}",
      ].join("\n"),
      errors: [
        {
          messageId: "ifElseBooleanLiteral" as const,
          suggestions: [
            {
              messageId: "ifElseBooleanLiteralSuggest" as const,
              output: `isOk = !hasErrors;`,
            },
          ],
        },
      ],
    },

    // Pattern 2 fires when Pattern 4 skips: same boolean value both sides
    {
      code: `if (cond) { return true; } else { return true; }`,
      errors: [
        {
          messageId: "unnecessaryElse" as const,
          suggestions: [
            {
              messageId: "unnecessaryElseSuggest" as const,
              output: `if (cond) { return true; }\nreturn true;`,
            },
          ],
        },
      ],
    },

    // Pattern 4 suppresses Pattern 2: boolean return if/else fires Pattern 4 only
    {
      code: [
        "function check(x) {",
        "  if (x > 0) {",
        "    return true;",
        "  } else {",
        "    return false;",
        "  }",
        "}",
      ].join("\n"),
      errors: [
        {
          messageId: "ifElseBooleanLiteral" as const,
          suggestions: [
            {
              messageId: "ifElseBooleanLiteralSuggest" as const,
              output: ["function check(x) {", "  return x > 0;", "}"].join(
                "\n",
              ),
            },
          ],
        },
      ],
    },
  ],
});
