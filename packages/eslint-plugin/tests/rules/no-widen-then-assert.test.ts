import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-widen-then-assert";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-widen-then-assert", rule, {
  valid: [
    // No widening annotation at all.
    'const value: string = "known"; console.log(value);',

    // Widened but never asserted back — read through the nullable type honestly.
    'let value: string | undefined = "known"; console.log(value ?? "fallback");',

    // Widened and reassigned before the assertion — the value may genuinely be nullish now.
    'let value: string | undefined = "known"; value = maybeUndefined(); console.log(value as string);',

    // Initializer is not a provably concrete value (a call could legitimately return undefined).
    "let value: string | undefined = maybeGetString(); console.log(value as string);",

    // Union of two concrete types, no nullish member — not a widening annotation.
    'let value: string | number = "known"; console.log(value as string);',

    // any/unknown widening is covered by no-type-system-bypass, not this rule.
    'let value: string | any = "known"; console.log(value as string);',
    'let value: string | unknown = "known"; console.log(value as string);',

    // Assertion target doesn't match the concrete branch — unrelated assertion.
    'let value: string | undefined = "known"; console.log(value as unknown);',

    // No annotation, just an assertion — outside this rule's scope.
    "const value = getValue(); console.log(value as string);",
  ],

  invalid: [
    {
      code: 'let value: string | undefined = "known"; console.log(value as string);',
      errors: [{ messageId: "widenThenAssert" }],
    },
    {
      code: 'let value: string | null = "known"; console.log(value as string);',
      errors: [{ messageId: "widenThenAssert" }],
    },
    {
      code: 'let value: string | null | undefined = "known"; console.log(value as string);',
      errors: [{ messageId: "widenThenAssert" }],
    },
    {
      code: 'let value: string | undefined = "known"; console.log(value!);',
      errors: [{ messageId: "widenThenAssert" }],
    },
    {
      code: "let value: number | undefined = 42; console.log(value as number);",
      errors: [{ messageId: "widenThenAssert" }],
    },
    {
      code: "let count: number | undefined = 0; use(count!);",
      errors: [{ messageId: "widenThenAssert" }],
    },
    {
      code: 'let value: string | undefined = "known"; console.log(<string>value);',
      errors: [{ messageId: "widenThenAssert" }],
    },
  ],
});
