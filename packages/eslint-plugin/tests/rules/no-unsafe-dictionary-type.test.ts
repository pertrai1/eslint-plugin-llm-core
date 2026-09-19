import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-unsafe-dictionary-type";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
const ruleTester = new RuleTester();

ruleTester.run("no-unsafe-dictionary-type", rule, {
  valid: [
    "const users: Record<string, User> = {};",
    "type Users = { [id: string]: User };",
    "const values: Record<string, string | number> = {};",
  ],
  invalid: [
    {
      code: "const values: Record<string, unknown> = {};",
      errors: [{ messageId: "unsafeDictionary" }],
    },
    {
      code: "const values: Record<string, any> = {};",
      errors: [{ messageId: "unsafeDictionary" }],
    },
    {
      code: "type Values = { [key: string]: object };",
      errors: [{ messageId: "unsafeDictionary" }],
    },
    {
      code: "type Values = { [key: string]: {} };",
      errors: [{ messageId: "unsafeDictionary" }],
    },
  ],
});
