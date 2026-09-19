import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-object-parameters";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
const ruleTester = new RuleTester();

ruleTester.run("no-object-parameters", rule, {
  valid: [
    "function load(input: User): void {}",
    "function load(input: Record<string, unknown>): void {}",
    "const load = (input: string): void => {};",
    "function load(input): void {}",
    "function load(...inputs: object[]): void {}",
  ],
  invalid: [
    {
      code: "function load(input: object): void {}",
      errors: [{ messageId: "objectParameter" }],
    },
    {
      code: "const load = (input: object): void => {};",
      errors: [{ messageId: "objectParameter" }],
    },
    {
      code: "type Input = object; function load(input: Input): void {}",
      errors: [{ messageId: "objectParameter" }],
    },
    {
      code: "function load(input: object = {}): void {}",
      errors: [{ messageId: "objectParameter" }],
    },
    {
      code: "function load(input: object | null): void {}",
      errors: [{ messageId: "objectParameter" }],
    },
    {
      code: "export type Input = object; function load(input: Input): void {}",
      errors: [{ messageId: "objectParameter" }],
    },
    {
      code: "class Loader { constructor(public input: object) {} }",
      errors: [{ messageId: "objectParameter" }],
    },
  ],
});
