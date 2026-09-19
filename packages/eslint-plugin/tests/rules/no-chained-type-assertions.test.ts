import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-chained-type-assertions";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-chained-type-assertions", rule, {
  valid: [
    "const user = data as User;",
    "const value = data as const;",
    "const value = (data as const) as const;",
    "const value = <User>data;",
  ],
  invalid: [
    {
      code: "const user = (data as unknown) as User;",
      errors: [{ messageId: "chained" }],
    },
    {
      code: "const user = <User><unknown>data;",
      errors: [{ messageId: "chained" }],
    },
    {
      code: "const user = ((data as unknown)) as User;",
      errors: [{ messageId: "chained" }],
    },
  ],
});
