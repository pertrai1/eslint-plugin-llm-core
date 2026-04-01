import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import rule from "../../src/rules/no-exported-function-expressions";

RuleTester.afterAll = afterAll;
RuleTester.it = it;
RuleTester.describe = describe;

const ruleTester = new RuleTester();

ruleTester.run("no-exported-function-expressions", rule, {
  valid: [
    // Function declarations
    "export function fetchData() { return 1; }",
    "export async function fetchData() { return 1; }",
    "export default function fetchData() { return 1; }",
    "export default function App() { return 'hello'; }",

    // Non-function exports
    "export const API_URL = 'https://api.example.com';",
    "export const config = { key: 'value' };",
    "export const items = [1, 2, 3];",
    "export const count = 42;",

    // Non-exported arrow functions (internal use is fine)
    "const helper = () => 'internal';",
    "const process = async () => { return 1; };",
    "const fn = function() { return 1; };",

    // Export of non-function values
    "export const result = someFunction();",
    "export const value = new Map();",

    // Type exports
    "export type Foo = string;",
    "export interface Bar { id: string; }",

    // Re-exports
    "export { foo } from './foo';",

    // Class exports
    "export class MyService { run() {} }",
    "export default class MyService { run() {} }",
  ],

  invalid: [
    // Named export arrow function
    {
      code: "export const fetchData = () => { return 1; };",
      errors: [
        {
          messageId: "noExportedFunctionExpression" as const,
          suggestions: [
            {
              messageId: "convertToDeclaration" as const,
              output: "export function fetchData() { return 1; }",
            },
          ],
        },
      ],
    },
    // Named export async arrow function
    {
      code: "export const fetchData = async () => { return 1; };",
      errors: [
        {
          messageId: "noExportedFunctionExpression" as const,
          suggestions: [
            {
              messageId: "convertToDeclaration" as const,
              output: "export async function fetchData() { return 1; }",
            },
          ],
        },
      ],
    },
    // Named export arrow function with params
    {
      code: "export const add = (a: number, b: number) => { return a + b; };",
      errors: [
        {
          messageId: "noExportedFunctionExpression" as const,
          suggestions: [
            {
              messageId: "convertToDeclaration" as const,
              output:
                "export function add(a: number, b: number) { return a + b; }",
            },
          ],
        },
      ],
    },
    // Named export function expression
    {
      code: "export const fetchData = function() { return 1; };",
      errors: [
        {
          messageId: "noExportedFunctionExpression" as const,
          suggestions: [
            {
              messageId: "convertToDeclaration" as const,
              output: "export function fetchData() { return 1; }",
            },
          ],
        },
      ],
    },
    // Named export async function expression
    {
      code: "export const fetchData = async function() { return 1; };",
      errors: [
        {
          messageId: "noExportedFunctionExpression" as const,
          suggestions: [
            {
              messageId: "convertToDeclaration" as const,
              output: "export async function fetchData() { return 1; }",
            },
          ],
        },
      ],
    },
    // Arrow function with expression body (no braces)
    {
      code: "export const double = (x: number) => x * 2;",
      errors: [
        {
          messageId: "noExportedFunctionExpression" as const,
          suggestions: [
            {
              messageId: "convertToDeclaration" as const,
              output: "export function double(x: number) {\n  return x * 2;\n}",
            },
          ],
        },
      ],
    },
    // Default export anonymous arrow function
    {
      code: "export default () => { return 1; };",
      errors: [
        {
          messageId: "noDefaultFunctionExpression" as const,
          suggestions: [
            {
              messageId: "convertDefaultToDeclaration" as const,
              output: "export default function functionName() { return 1; }",
            },
          ],
        },
      ],
    },
    // Default export async anonymous arrow function
    {
      code: "export default async () => { return 1; };",
      errors: [
        {
          messageId: "noDefaultFunctionExpression" as const,
          suggestions: [
            {
              messageId: "convertDefaultToDeclaration" as const,
              output:
                "export default async function functionName() { return 1; }",
            },
          ],
        },
      ],
    },
    // Default export anonymous function declaration
    {
      code: "export default function() { return 1; }",
      errors: [
        {
          messageId: "noDefaultFunctionExpression" as const,
          suggestions: [
            {
              messageId: "convertDefaultToDeclaration" as const,
              output: "export default function functionName() { return 1; }",
            },
          ],
        },
      ],
    },
    // Default export arrow with params
    {
      code: "export default (a: number, b: number) => { return a + b; };",
      errors: [
        {
          messageId: "noDefaultFunctionExpression" as const,
          suggestions: [
            {
              messageId: "convertDefaultToDeclaration" as const,
              output:
                "export default function functionName(a: number, b: number) { return a + b; }",
            },
          ],
        },
      ],
    },
    // Multiple violations in one declaration
    {
      code: "export const a = () => 1, b = () => 2;",
      errors: [
        {
          messageId: "noExportedFunctionExpression" as const,
          suggestions: [
            {
              messageId: "convertToDeclaration" as const,
              output: "export function a() {\n  return 1;\n}",
            },
          ],
        },
        {
          messageId: "noExportedFunctionExpression" as const,
          suggestions: [
            {
              messageId: "convertToDeclaration" as const,
              output: "export function b() {\n  return 2;\n}",
            },
          ],
        },
      ],
    },
    // Arrow with type parameters
    {
      code: "export const identity = <T,>(x: T) => x;",
      errors: [
        {
          messageId: "noExportedFunctionExpression" as const,
          suggestions: [
            {
              messageId: "convertToDeclaration" as const,
              output: "export function identity<T,>(x: T) {\n  return x;\n}",
            },
          ],
        },
      ],
    },
    // Arrow with return type annotation
    {
      code: "export const greet = (name: string): string => { return `hello ${name}`; };",
      errors: [
        {
          messageId: "noExportedFunctionExpression" as const,
          suggestions: [
            {
              messageId: "convertToDeclaration" as const,
              output:
                "export function greet(name: string): string { return `hello ${name}`; }",
            },
          ],
        },
      ],
    },
  ],
});
