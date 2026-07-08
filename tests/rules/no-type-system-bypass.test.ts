import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-type-system-bypass";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-type-system-bypass", rule, {
  valid: [
    "const user = data as User;",
    "const value = data as unknown;",
    "const result = data as any;", // Covered by no-type-assertion-any.
    "const values: Array<any> = [];", // Covered by no-any-in-generic.
    "const items: string[] = [];",
    "function parse(input: unknown): User { return UserSchema.parse(input); }",
    "const maybeUser = users.find((user) => user.id === id);\nif (!maybeUser) throw new Error('missing');\nmaybeUser.name;",
    "// @ts-expect-error TS2345: upstream package types reject documented runtime option\ncallLibrary({ experimental: true });",
    "// TODO: remove once upstream package ships fixed types\ncallLibrary({ experimental: true });",
    "type Maybe<T> = T | null | undefined;",
    "function wrap<T>(value: T): T[] { return [value]; }",
  ],

  invalid: [
    {
      code: "// @ts-ignore\ncallLibrary({ experimental: true });",
      errors: [{ messageId: "tsIgnoreDirective" as const }],
    },
    {
      code: "// @ts-expect-error\ncallLibrary({ experimental: true });",
      errors: [{ messageId: "unexplainedTsExpectError" as const }],
    },
    {
      code: "// @ts-expect-error TODO\ncallLibrary({ experimental: true });",
      errors: [{ messageId: "unexplainedTsExpectError" as const }],
    },
    {
      code: "const user = data as unknown as User;",
      errors: [{ messageId: "doubleAssertion" as const }],
    },
    {
      code: "const user = (<unknown>data) as User;",
      errors: [{ messageId: "doubleAssertion" as const }],
    },
    {
      code: "const name = user!.profile.name;",
      errors: [{ messageId: "nonNullAssertion" as const }],
    },
    {
      code: "let payload: any = loadPayload();",
      errors: [{ messageId: "explicitAny" as const }],
    },
    {
      code: "function handle(payload: any): void { process(payload); }",
      errors: [{ messageId: "explicitAny" as const }],
    },
    {
      code: "function load(): any { return JSON.parse(raw); }",
      errors: [{ messageId: "explicitAny" as const }],
    },
    {
      code: "type Handler = (event: any) => void;",
      errors: [{ messageId: "explicitAny" as const }],
    },
  ],
});
