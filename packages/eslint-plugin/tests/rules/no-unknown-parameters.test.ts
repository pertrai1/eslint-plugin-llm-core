import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-unknown-parameters";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
const ruleTester = new RuleTester();

ruleTester.run("no-unknown-parameters", rule, {
  valid: [
    "function parse(input: string): User { return parseUser(input); }",
    "function wrap<T>(input: T): T { return input; }",
    "function fail(message: string, cause: unknown): never { throw new Error(message, { cause }); }",
  ],
  invalid: [
    {
      code: "function parse(input: unknown): User { return parseUser(input); }",
      errors: [{ messageId: "unknownParameter" }],
    },
    {
      code: "const parse = (input: unknown): User => parseUser(input);",
      errors: [{ messageId: "unknownParameter" }],
    },
    {
      code: "function parse(input: unknown = getInput()): void {}",
      errors: [{ messageId: "unknownParameter" }],
    },
  ],
});
