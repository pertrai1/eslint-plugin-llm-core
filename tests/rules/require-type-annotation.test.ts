import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/require-type-annotation";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("require-type-annotation", rule, {
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

    // Destructured param without type annotation
    {
      code: `export function foo({ id }): void {}`,
      errors: [{ messageId: "missingParamType" as const }],
    },
  ],
});
