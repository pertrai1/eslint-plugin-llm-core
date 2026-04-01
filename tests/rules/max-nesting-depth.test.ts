import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/max-nesting-depth";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("max-nesting-depth", rule, {
  valid: [
    // Depth 1 — single nesting
    "if (a) { doSomething(); }",
    "for (const x of items) { process(x); }",
    "while (running) { tick(); }",

    // Depth 2
    "if (a) { if (b) { doSomething(); } }",
    "for (const x of items) { if (x.active) { process(x); } }",

    // Depth 3 (at the default limit)
    "if (a) { for (const x of items) { if (x.active) { process(x); } } }",

    // else-if does NOT count as additional nesting
    "if (a) { } else if (b) { } else if (c) { } else { }",

    // else-if with nesting inside — depth 2 (if + nested if)
    "if (a) { } else if (b) { if (c) { doSomething(); } }",

    // Depth 3 with else-if (if + else-if body has for + if)
    "if (a) { } else if (b) { for (const x of items) { if (x) { process(x); } } }",

    // try/catch counts as 1
    "try { doSomething(); } catch (e) { handleError(e); }",

    // switch counts as 1
    "switch (action) { case 'a': break; case 'b': break; }",

    // Custom max option
    {
      code: "if (a) { if (b) { if (c) { if (d) { doSomething(); } } } }",
      options: [{ max: 4 }],
    },

    // Flat code — no nesting
    "const x = 1; const y = 2; doSomething(x, y);",

    // Function bodies don't count
    `function foo() {
      if (a) {
        if (b) {
          if (c) {
            doSomething();
          }
        }
      }
    }`,
  ],

  invalid: [
    // Depth 4 — exceeds default max of 3
    {
      code: "if (a) { if (b) { if (c) { if (d) { doSomething(); } } } }",
      errors: [{ messageId: "maxNestingDepth" as const }],
    },

    // for + if + for + if = depth 4
    {
      code: "for (const x of a) { if (x) { for (const y of x) { if (y) { process(y); } } } }",
      errors: [{ messageId: "maxNestingDepth" as const }],
    },

    // while + if + if + if = depth 4
    {
      code: "while (a) { if (b) { if (c) { if (d) { doSomething(); } } } }",
      errors: [{ messageId: "maxNestingDepth" as const }],
    },

    // try + if + for + if = depth 4
    {
      code: "try { if (a) { for (const x of items) { if (x) { process(x); } } } } catch (e) {}",
      errors: [{ messageId: "maxNestingDepth" as const }],
    },

    // switch + if + if + if = depth 4
    {
      code: "switch (a) { case 'x': if (b) { if (c) { if (d) { doSomething(); } } } break; }",
      errors: [{ messageId: "maxNestingDepth" as const }],
    },

    // Custom max of 2
    {
      code: "if (a) { if (b) { if (c) { doSomething(); } } }",
      options: [{ max: 2 }],
      errors: [{ messageId: "maxNestingDepth" as const }],
    },

    // Multiple violations
    {
      code: `if (a) {
        if (b) {
          if (c) {
            if (d) { one(); }
            if (e) { two(); }
          }
        }
      }`,
      errors: [
        { messageId: "maxNestingDepth" as const },
        { messageId: "maxNestingDepth" as const },
      ],
    },

    // do-while nesting
    {
      code: "do { if (a) { for (const x of b) { if (x) { process(x); } } } } while (c);",
      errors: [{ messageId: "maxNestingDepth" as const }],
    },

    // for-in nesting
    {
      code: "for (const k in obj) { if (a) { for (const x of b) { if (x) { process(x); } } } }",
      errors: [{ messageId: "maxNestingDepth" as const }],
    },

    // Max 1 — even 2 levels is too deep
    {
      code: "if (a) { if (b) { doSomething(); } }",
      options: [{ max: 1 }],
      errors: [{ messageId: "maxNestingDepth" as const }],
    },
  ],
});
