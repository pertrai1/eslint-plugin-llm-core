import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/throw-error-objects";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("throw-error-objects", rule, {
  valid: [
    // throw new Error — correct
    `throw new Error("something went wrong");`,

    // throw new subclass
    `throw new ValidationError("invalid input");`,

    // throw identifier — may be an Error, cannot tell without types
    `throw err;`,

    // throw member expression
    `throw context.error;`,

    // throw call expression
    `throw createError("msg");`,

    // throw new expression with computed argument
    `throw new Error(\`failed: \${reason}\`);`,
  ],

  invalid: [
    // throw string literal
    {
      code: `throw "something went wrong";`,
      errors: [{ messageId: "throwErrorObjects" as const }],
    },

    // throw template literal
    {
      code: `throw \`error: \${message}\`;`,
      errors: [{ messageId: "throwErrorObjects" as const }],
    },

    // throw plain object
    {
      code: `throw { code: 404, message: "not found" };`,
      errors: [{ messageId: "throwErrorObjects" as const }],
    },

    // throw array
    {
      code: `throw ["error", "details"];`,
      errors: [{ messageId: "throwErrorObjects" as const }],
    },

    // throw number literal
    {
      code: `throw 500;`,
      errors: [{ messageId: "throwErrorObjects" as const }],
    },

    // throw boolean
    {
      code: `throw false;`,
      errors: [{ messageId: "throwErrorObjects" as const }],
    },

    // throw string inside function
    {
      code: `function validate(x: number) { if (x < 0) throw "negative"; }`,
      errors: [{ messageId: "throwErrorObjects" as const }],
    },
  ],
});
