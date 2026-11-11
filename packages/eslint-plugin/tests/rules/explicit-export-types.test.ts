import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/explicit-export-types";
import { TSESLint } from "@typescript-eslint/utils";
import { describe, expect, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("explicit-export-types", rule, {
  valid: [
    // Typed local functions retain the same contract through indirect exports
    `function fn(x: string): string { return x; } export { fn };`,
    `const fn = (x: string): string => x; export { fn as renamed };`,
    `const fn = function(x: string): string { return x; }; export { fn };`,
    `function fn(x: string): string { return x; } export default fn;`,
    `const fn = (x: string): string => x; export default fn;`,
    `const fn = function(x: string): string { return x; }; export default fn;`,

    // Preserve primitive-default inference for both indirect export forms
    `function fn(n = 0, s = "", b = true, v = null, big = 0n, neg = -1, pos = +1): void {} export { fn };`,
    `const fn = (n = 0, s = "", b = false, v = null, big = 0n, neg = -1, pos = +1): void => {}; export default fn;`,

    // Imports and source re-exports must not resolve unrelated local functions
    `import { fn } from "./module"; export { fn };`,
    `import fn from "./module"; export default fn;`,
    `function fn(x) { return x; } export { fn } from "./module";`,
    `export * from "./module";`,

    // Type-only exports do not expose a callable value
    `function fn(x) { return x; } export type { fn };`,
    `const fn = (x) => x; export { type fn };`,

    // Non-functions and declarations without implementations remain out of scope
    `const value = 42; export { value }; export default value;`,
    `class Example { method(x) { return x; } } export default Example;`,
    `declare function fn(x: string): string; export { fn };`,
    `export default missing;`,

    // Do not infer through alias chains, assignments or destructuring
    `const fn = (x) => x; const alias = fn; export { alias };`,
    `const fn = (x) => x; const alias = fn; export default alias;`,
    `let fn; fn = (x) => x; export { fn };`,
    `const { fn } = { fn: (x) => x }; export { fn };`,

    // Scope resolution checks the exported binding, not a nested namesake
    `const fn = (x: string): string => x; function internal() { const fn = (x) => x; } export { fn };`,

    // Exported function with all param types + return type
    `export function greet(name: string): string { return "Hello " + name; }`,

    // Exported function with no params and explicit return type
    `export function ping(): void {}`,

    // Non-exported function — not flagged
    `function internal(x) { return x; }`,

    // Non-exported arrow — not flagged
    `const helper = (x) => x;`,

    // Exported arrow with full types
    `export const add = (a: number, b: number): number => a + b;`,

    // Exported function expression with full types
    `export const fn = function(x: string): boolean { return x.length > 0; };`,

    // Destructured param with type annotation on the pattern
    `export function foo({ id }: { id: string }): void {}`,

    // Rest param with type
    `export function foo(...args: string[]): void {}`,

    // Default param with explicit type on the identifier
    `export function foo(x: number = 0): string { return String(x); }`,

    // Default param with number literal — type inferrable, no annotation needed
    `export function foo(x = 0): string { return String(x); }`,

    // Default param with string literal — type inferrable
    `export function foo(name = "default"): string { return name; }`,

    // Default param with boolean literal — type inferrable
    `export function foo(enabled = true): string { return String(enabled); }`,

    // Default param with null literal — type inferrable
    `export function foo(value = null): string { return String(value); }`,

    // Default param with negative number literal — type inferrable
    `export function foo(offset = -1): string { return String(offset); }`,

    // Default param with bigint literal — type inferrable
    `export function foo(big = 0n): string { return String(big); }`,

    // Mixed: one typed, one with inferrable default — both fine
    `export function foo(name: string, retries = 3): string { return name; }`,

    // Re-exported type alias — not a function, not flagged
    `export type Foo = { id: string };`,

    // Re-export of a value — no declaration, not flagged
    `export { something } from "./module";`,

    // Exported class — not a function, not flagged
    `export class MyClass { method() {} }`,

    // Exported const that is not a function
    `export const MAX = 100;`,

    // Default export of a non-function
    `export default 42;`,
  ],

  invalid: [
    // Function declarations can be exported before they appear
    {
      code: `export { fn }; function fn(x) { return x; }`,
      errors: [
        { messageId: "missingReturnType", data: { fn: "fn" } },
        { messageId: "missingParamType", data: { fn: "fn", param: "x" } },
      ],
    },
    {
      code: `export default fn; function fn(x) { return x; }`,
      errors: [
        { messageId: "missingReturnType", data: { fn: "fn" } },
        { messageId: "missingParamType", data: { fn: "fn", param: "x" } },
      ],
    },
    // Forward variable references and default specifiers also resolve locally
    {
      code: `export { fn as default }; const fn = (x: string) => x;`,
      errors: [{ messageId: "missingReturnType", data: { fn: "fn" } }],
    },
    // Named function expressions use the exported local binding name
    {
      code: `const fn = function inner(x): string { return x; }; export { fn };`,
      errors: [
        { messageId: "missingParamType", data: { fn: "fn", param: "x" } },
      ],
    },
    {
      code: `const fn = function(x: string) { return x; }; export default fn;`,
      errors: [{ messageId: "missingReturnType", data: { fn: "fn" } }],
    },
    // Both variables in a shared declaration are checked independently
    {
      code: `const first = () => 1, second = () => 2; export { first, second };`,
      errors: [
        { messageId: "missingReturnType", data: { fn: "first" } },
        { messageId: "missingReturnType", data: { fn: "second" } },
      ],
    },
    // A type-only reference does not prevent a later value export being checked
    {
      code: `function fn(x: string) { return x; } export { type fn, fn as value };`,
      errors: [{ messageId: "missingReturnType", data: { fn: "fn" } }],
    },
    // Deduplication works when indirect export visitors run before inline visitors
    {
      code: `export { fn as alias }; export function fn(x: string) { return x; }`,
      errors: [{ messageId: "missingReturnType", data: { fn: "fn" } }],
    },
    {
      code: `export default function fn(x: string) { return x; } export { fn };`,
      errors: [{ messageId: "missingReturnType", data: { fn: "fn" } }],
    },
    {
      code: `function fn(x: string) { return x; } export { fn }; export { fn as alias };`,
      errors: [{ messageId: "missingReturnType", data: { fn: "fn" } }],
    },
    // Non-literal defaults, destructuring and rest parameters still need types
    {
      code: `function fn(x = getDefault()): void {} export { fn };`,
      errors: [
        { messageId: "missingParamType", data: { fn: "fn", param: "x" } },
      ],
    },
    {
      code: `const fn = ({ id } = {}, ...args): void => {}; export default fn;`,
      errors: [
        {
          messageId: "missingParamType",
          data: { fn: "fn", param: "{ id }" },
        },
        { messageId: "missingParamType", data: { fn: "fn", param: "...args" } },
      ],
    },

    // A function exported more than once is diagnosed only once
    {
      code: `export const fn = (x) => x; export { fn as alias, fn as second }; export default fn;`,
      errors: [
        { messageId: "missingReturnType", data: { fn: "fn" } },
        { messageId: "missingParamType", data: { fn: "fn", param: "x" } },
      ],
    },

    // Default identifiers resolve the local function initializer
    {
      code: `const handler = (req) => req.body; export default handler;`,
      errors: [
        { messageId: "missingReturnType", data: { fn: "handler" } },
        {
          messageId: "missingParamType",
          data: { fn: "handler", param: "req" },
        },
      ],
    },

    // A local arrow is checked through its exported binding
    {
      code: `const handler = (req) => req.body; export { handler };`,
      errors: [
        { messageId: "missingReturnType", data: { fn: "handler" } },
        {
          messageId: "missingParamType",
          data: { fn: "handler", param: "req" },
        },
      ],
    },

    // Named exports resolve the local function, not the exported alias
    {
      code: `function local(x) { return x; } export { local as publicName };`,
      errors: [
        {
          messageId: "missingReturnType",
          data: { fn: "local" },
          line: 1,
          column: 10,
        },
        {
          messageId: "missingParamType",
          data: { fn: "local", param: "x" },
          line: 1,
          column: 16,
        },
      ],
    },

    // Missing return type only
    {
      code: `export function foo(x: string) { return x; }`,
      errors: [{ messageId: "missingReturnType" as const }],
    },

    // Missing param type only
    {
      code: `export function foo(x): string { return x; }`,
      errors: [{ messageId: "missingParamType" as const }],
    },

    // Missing both param type and return type
    {
      code: `export function foo(x) { return x; }`,
      errors: [
        { messageId: "missingReturnType" as const },
        { messageId: "missingParamType" as const },
      ],
    },

    // Multiple params, one missing type
    {
      code: `export function foo(a: string, b): void {}`,
      errors: [{ messageId: "missingParamType" as const }],
    },

    // Multiple params, all missing types
    {
      code: `export function foo(a, b): void {}`,
      errors: [
        { messageId: "missingParamType" as const },
        { messageId: "missingParamType" as const },
      ],
    },

    // Arrow function missing return type
    {
      code: `export const foo = (x: string) => x;`,
      errors: [{ messageId: "missingReturnType" as const }],
    },

    // Arrow function missing param type
    {
      code: `export const foo = (x): string => x;`,
      errors: [{ messageId: "missingParamType" as const }],
    },

    // Arrow function missing both
    {
      code: `export const foo = (x) => x;`,
      errors: [
        { messageId: "missingReturnType" as const },
        { messageId: "missingParamType" as const },
      ],
    },

    // Function expression missing return type
    {
      code: `export const fn = function(x: string) { return x; };`,
      errors: [{ messageId: "missingReturnType" as const }],
    },

    // Default export missing return type
    {
      code: `export default function handler(req: Request) { return req; }`,
      errors: [{ messageId: "missingReturnType" as const }],
    },

    // Default export missing param type
    {
      code: `export default function handler(req): Response { return req; }`,
      errors: [{ messageId: "missingParamType" as const }],
    },

    // Destructured object param without type annotation
    {
      code: `export function foo({ id }): void {}`,
      errors: [{ messageId: "missingParamType" as const }],
    },

    // Destructured array param without type annotation
    {
      code: `export function foo([first]): void {}`,
      errors: [{ messageId: "missingParamType" as const }],
    },

    // Rest param without type annotation
    {
      code: `export function foo(...args): void {}`,
      errors: [{ messageId: "missingParamType" as const }],
    },

    // Default param with non-literal default — type is NOT inferrable, must annotate
    {
      code: `export function foo(x = getDefault()): string { return String(x); }`,
      errors: [{ messageId: "missingParamType" as const }],
    },

    // Anonymous default export missing return type
    {
      code: `export default function() { return 1; }`,
      errors: [{ messageId: "missingReturnType" as const }],
    },

    // Default value with destructured object left side — no type annotation
    {
      code: `export function foo({ id } = {}): void {}`,
      errors: [{ messageId: "missingParamType" as const }],
    },

    // Default value with destructured array left side — no type annotation
    {
      code: `export function foo([first] = []): void {}`,
      errors: [{ messageId: "missingParamType" as const }],
    },
  ],
});

function lintMessages(code: string): string[] {
  const config: TSESLint.Linter.ConfigType = [
    {
      plugins: { test: { rules: { "export-types": rule } } },
      rules: { "test/export-types": "error" },
    },
  ];
  return new TSESLint.Linter()
    .verify(code, config)
    .map((message) => message.message);
}

describe("explicit-export-types message details", () => {
  it("tells the agent to annotate the named parameter with a concrete type", () => {
    const messages = lintMessages(
      `export function saveUser(user) { return user; }`,
    );

    expect(messages[1]).toContain(
      "  Annotate 'user' with its concrete type; do not use `any` or `unknown`, which other rules flag.",
    );
  });

  it("tells the agent to declare the named function's concrete return type", () => {
    const messages = lintMessages(
      `export function saveUser(user) { return user; }`,
    );

    expect(messages[0]).toContain(
      "  Declare the concrete return type of 'saveUser'; do not use `any` or `unknown`, which other rules flag.",
    );
  });
});
