import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/explicit-export-types";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("explicit-export-types", rule, {
  valid: [
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
