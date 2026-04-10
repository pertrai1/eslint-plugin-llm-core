import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/max-params";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("max-params", rule, {
  valid: [
    // 0 params
    "function noParams() {}",
    "const noParams = () => {};",

    // 1 param
    "function oneParam(a: string) {}",
    "const oneParam = (a: string) => {};",

    // 2 params (at default limit)
    "function twoParams(a: string, b: number) {}",
    "const twoParams = (a: string, b: number) => {};",

    // Object parameter pattern
    "function fetch(options: { url: string; timeout: number; retries: number }) {}",

    // Destructured object parameter
    "function fetch({ url, timeout, retries }: Options) {}",

    // Constructor with up to 5 params (default maxConstructor)
    {
      code: "class Service { constructor(a: A, b: B, c: C, d: D, e: E) {} }",
    },

    // Custom max option
    {
      code: "function fourParams(a: string, b: number, c: boolean, d: object) {}",
      options: [{ max: 4 }],
    },

    // Non-exported function can use maxInternal
    {
      code: "function handleError(error: Error, message: string, context: object) {}",
      options: [{ max: 2, maxInternal: 3 }],
    },

    // Non-exported arrow function can use maxInternal
    {
      code: "const formatError = (err: Error, msg: string, ctx: object) => {};",
      options: [{ max: 2, maxInternal: 3 }],
    },

    // Arrow function with 2 params
    "const add = (a: number, b: number) => a + b;",

    // Method with 2 params
    "class Foo { bar(a: string, b: number) {} }",
  ],

  invalid: [
    // 3 params — exceeds default max of 2
    {
      code: "function threeParams(a: string, b: number, c: boolean) {}",
      errors: [{ messageId: "maxParams" as const }],
    },

    // Arrow function with 3 params
    {
      code: "const fn = (a: string, b: number, c: boolean) => {};",
      errors: [{ messageId: "maxParams" as const }],
    },

    // Function expression with 3 params
    {
      code: "const fn = function(a: string, b: number, c: boolean) {};",
      errors: [{ messageId: "maxParams" as const }],
    },

    // 5 params
    {
      code: "function manyParams(a: string, b: number, c: boolean, d: object, e: string[]) {}",
      errors: [{ messageId: "maxParams" as const }],
    },

    // Method with too many params
    {
      code: "class Foo { bar(a: string, b: number, c: boolean) {} }",
      errors: [{ messageId: "maxParams" as const }],
    },

    // Default params still count
    {
      code: "function fn(a: string, b: number, c = true) {}",
      errors: [{ messageId: "maxParams" as const }],
    },

    // Constructor exceeding maxConstructor (default 5)
    {
      code: "class Service { constructor(a: A, b: B, c: C, d: D, e: E, f: F) {} }",
      errors: [{ messageId: "maxParams" as const }],
    },

    // Custom max of 1
    {
      code: "function fn(a: string, b: number) {}",
      options: [{ max: 1 }],
      errors: [{ messageId: "maxParams" as const }],
    },

    // Custom maxConstructor
    {
      code: "class Service { constructor(a: A, b: B, c: C) {} }",
      options: [{ maxConstructor: 2 }],
      errors: [{ messageId: "maxParams" as const }],
    },

    // Non-exported function exceeding maxInternal
    {
      code: "function processData(a: string, b: number, c: boolean, d: object) {}",
      options: [{ max: 2, maxInternal: 3 }],
      errors: [{ messageId: "maxParams" as const }],
    },

    // Exported function still uses max
    {
      code: "export function publicApi(a: string, b: number, c: boolean) {}",
      options: [{ max: 2, maxInternal: 3 }],
      errors: [{ messageId: "maxParams" as const }],
    },

    // Exported arrow function still uses max
    {
      code: "export const createHandler = (a: string, b: number, c: boolean) => {};",
      options: [{ max: 2, maxInternal: 3 }],
      errors: [{ messageId: "maxParams" as const }],
    },

    // Without maxInternal, internal functions fall back to max
    {
      code: "function internalHelper(a: string, b: number, c: boolean) {}",
      options: [{ max: 2 }],
      errors: [{ messageId: "maxParams" as const }],
    },

    // Async function
    {
      code: "async function fetch(url: string, timeout: number, retries: number) {}",
      errors: [{ messageId: "maxParams" as const }],
    },

    // Export
    {
      code: "export function fetch(url: string, timeout: number, retries: number) {}",
      errors: [{ messageId: "maxParams" as const }],
    },
  ],
});
