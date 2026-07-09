import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-inline-disable";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  linterOptions: {
    // Prevent ESLint's own "unused eslint-disable" warnings from interfering
    reportUnusedDisableDirectives: "off",
  },
});

ruleTester.run("no-inline-disable", rule, {
  valid: [
    // Normal comments are fine
    "// This is a regular comment",
    "/* Block comment */",
    "// TODO: fix this later",
    "// FIXME: something broken",

    // Code without any disable comments
    "const x = 1;",
    "function foo() { return 1; }",

    // Comments that mention eslint but aren't directives
    "// See eslint docs for more info",
    "// This was flagged by eslint-plugin-foo",
  ],

  invalid: [
    {
      code: "// eslint-disable-next-line no-unused-vars\nconst x = 1;",
      errors: [{ messageId: "noInlineDisable" as const }],
    },

    // eslint-disable (block)
    {
      code: "/* eslint-disable no-unused-vars */\nconst x = 1;",
      errors: [{ messageId: "noInlineDisable" as const }],
    },

    // eslint-enable
    {
      code: "/* eslint-enable no-unused-vars */",
      errors: [{ messageId: "noInlineDisable" as const }],
    },

    {
      code: "const x = 1; // eslint-disable-line no-unused-vars",
      errors: [{ messageId: "noInlineDisable" as const }],
    },

    // Multiple disable comments
    {
      code: "// eslint-disable-next-line no-unused-vars\nconst x = 1;\n// eslint-disable-next-line no-console\nconsole.log(x);",
      errors: [
        { messageId: "noInlineDisable" as const },
        { messageId: "noInlineDisable" as const },
      ],
    },

    // Disable targeting a specific rule
    {
      code: "// eslint-disable-next-line semi\nconst x = 1;",
      errors: [{ messageId: "noInlineDisable" as const }],
    },
  ],
});
