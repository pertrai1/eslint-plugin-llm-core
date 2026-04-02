import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-type-assertion-any";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-type-assertion-any", rule, {
  valid: [
    // Assertion to specific type
    `const result = data as string;`,

    // Assertion to unknown
    `const result = data as unknown;`,

    // Double assertion through unknown (acceptable escape hatch)
    `const result = data as unknown as SpecificType;`,

    // Assertion to union type
    `const result = value as string | number;`,

    // Assertion to interface
    `const user = response as User;`,

    // No assertion at all
    `const x: number = 42;`,

    // typeof check (not an assertion)
    `if (typeof x === "string") { process(x); }`,

    // Satisfies (not an assertion)
    `const config = { port: 3000 } satisfies Config;`,
  ],

  invalid: [
    // Basic as any
    {
      code: `const result = data as any;`,
      errors: [{ messageId: "noTypeAssertionAny" as const }],
    },

    // as any in member expression
    {
      code: `(response as any).body;`,
      errors: [{ messageId: "noTypeAssertionAny" as const }],
    },

    // as any in assignment
    {
      code: `const value: string = someFunction() as any;`,
      errors: [{ messageId: "noTypeAssertionAny" as const }],
    },

    // as any in function argument
    {
      code: `process(data as any);`,
      errors: [{ messageId: "noTypeAssertionAny" as const }],
    },

    // as any in return statement
    {
      code: `function get(): string { return value as any; }`,
      errors: [{ messageId: "noTypeAssertionAny" as const }],
    },

    // Angle bracket syntax <any>
    {
      code: `const result = <any>data;`,
      errors: [{ messageId: "noTypeAssertionAny" as const }],
    },

    // Nested as any
    {
      code: `const items = (getResponse() as any).data as any;`,
      errors: [
        { messageId: "noTypeAssertionAny" as const },
        { messageId: "noTypeAssertionAny" as const },
      ],
    },

    // as any on property access
    {
      code: `(obj.prop as any).method();`,
      errors: [{ messageId: "noTypeAssertionAny" as const }],
    },
  ],
});
