import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-known-value-widening";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
const ruleTester = new RuleTester();

ruleTester.run("no-known-value-widening", rule, {
  valid: [
    'const value = "known";',
    "const value: string = getValue();",
    "const value: unknown = getValue();",
    'const value: User = { name: "Ada" };',
    "const value: Record<string, User> = getUsers();",
    "class Config { value: unknown = getValue(); }",
  ],
  invalid: [
    {
      code: 'const value: unknown = "known";',
      errors: [{ messageId: "widening" }],
    },
    {
      code: 'const value: any = { name: "Ada" };',
      errors: [{ messageId: "widening" }],
    },
    { code: "const value: object = [];", errors: [{ messageId: "widening" }] },
    {
      code: 'const value: Record<string, unknown> = { name: "Ada" };',
      errors: [{ messageId: "widening" }],
    },
    {
      code: 'class Config { value: unknown = "known"; }',
      errors: [{ messageId: "widening" }],
    },
  ],
});
