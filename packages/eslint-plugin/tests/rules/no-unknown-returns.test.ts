import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-unknown-returns";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
const ruleTester = new RuleTester();

ruleTester.run("no-unknown-returns", rule, {
  valid: [
    "function parse(input: unknown): User { return UserSchema.parse(input); }",
    "function load(): Promise<User> { return loadUser(); }",
  ],
  invalid: [
    {
      code: "function load(): unknown { return raw; }",
      errors: [{ messageId: "unknownReturn" }],
    },
    {
      code: "async function load(): Promise<unknown> { return raw; }",
      errors: [{ messageId: "unknownReturn" }],
    },
    {
      code: "const load = (): unknown => raw;",
      errors: [{ messageId: "unknownReturn" }],
    },
  ],
});
