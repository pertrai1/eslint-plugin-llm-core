import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-unknown-type-aliases";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
const ruleTester = new RuleTester();

ruleTester.run("no-unknown-type-aliases", rule, {
  valid: ["type User = { id: string };", "type Value = string | number;"],
  invalid: [
    {
      code: "type Anything = unknown;",
      errors: [{ messageId: "unknownAlias" }],
    },
    {
      code: "type Raw = unknown; type Payload = Raw;",
      errors: [{ messageId: "unknownAlias" }, { messageId: "unknownAlias" }],
    },
    {
      code: "type Payload = Raw; type Raw = unknown;",
      errors: [{ messageId: "unknownAlias" }, { messageId: "unknownAlias" }],
    },
  ],
});
