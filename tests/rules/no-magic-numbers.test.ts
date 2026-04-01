import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-magic-numbers";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-magic-numbers", rule, {
  valid: [
    // Allowed by default: 0, 1, -1, 2
    "const x = items[0];",
    "const len = arr.length - 1;",
    "if (count > 0) {}",
    "const half = total / 2;",
    "for (let i = 0; i < 1; i++) {}",

    // Named constants are fine
    "const MAX_RETRIES = 5;",
    "const TIMEOUT_MS = 3000;",
    "const PI = 3.14159;",
    "export const MAX_SIZE = 1024;",

    // Array indexes
    "const first = items[3];",

    // Default parameter values
    "function retry(attempts = 3) {}",
    "const fn = (timeout = 5000) => {};",

    // Enum members
    "enum Status { Active = 10, Inactive = 20 }",

    // Type context
    "type Tuple = [string, string, string];",

    // Custom ignore list
    {
      code: "const x = 100;",
      options: [{ ignore: [100] }],
    },

    // Const in object
    "const config = { retries: 0, timeout: 1 };",

    // Numbers in const declaration expressions
    "const timeout = 5000 * 2;",
  ],

  invalid: [
    // Bare number in expression
    {
      code: "if (retries > 5) {}",
      errors: [{ messageId: "noMagicNumber" as const }],
    },

    // Number in function call
    {
      code: "setTimeout(callback, 3000);",
      errors: [{ messageId: "noMagicNumber" as const }],
    },

    // Number in comparison
    {
      code: "if (size > 1024) {}",
      errors: [{ messageId: "noMagicNumber" as const }],
    },

    // Number in arithmetic (not in const)
    {
      code: "let x = y * 100;",
      errors: [{ messageId: "noMagicNumber" as const }],
    },

    // Number in return
    {
      code: "function fn() { return 42; }",
      errors: [{ messageId: "noMagicNumber" as const }],
    },

    // Number in assignment
    {
      code: "let timeout = 5000;",
      errors: [{ messageId: "noMagicNumber" as const }],
    },

    // Multiple magic numbers
    {
      code: "if (x > 10 && y < 20) {}",
      errors: [
        { messageId: "noMagicNumber" as const },
        { messageId: "noMagicNumber" as const },
      ],
    },

    // Array index when ignoreArrayIndexes is false
    {
      code: "const x = items[5];",
      options: [{ ignoreArrayIndexes: false }],
      errors: [{ messageId: "noMagicNumber" as const }],
    },

    // Default value when ignoreDefaultValues is false
    {
      code: "function retry(attempts = 3) {}",
      options: [{ ignoreDefaultValues: false }],
      errors: [{ messageId: "noMagicNumber" as const }],
    },

    // Enum member when ignoreEnums is false
    {
      code: "enum Status { Active = 10 }",
      options: [{ ignoreEnums: false }],
      errors: [{ messageId: "noMagicNumber" as const }],
    },

    // Number in template literal
    {
      code: "const msg = `Limit is ${100}`;",
      errors: [{ messageId: "noMagicNumber" as const }],
    },
  ],
});
