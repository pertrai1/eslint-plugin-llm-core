import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-any-in-generic";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-any-in-generic", rule, {
  valid: [
    // Typed array
    `const items: Array<string> = [];`,

    // Typed Record
    `const cache: Record<string, User> = {};`,

    // Unknown generic
    `const items: Array<unknown> = [];`,

    // Map with specific types
    `const map: Map<string, number> = new Map();`,

    // Set with specific type
    `const set: Set<User> = new Set();`,

    // Promise with specific type
    `const promise: Promise<Response> = fetch("/api");`,

    // Nested generics with proper types
    `const data: Map<string, Array<User>> = new Map();`,

    // Generic function call with specific type
    `const result = createStore<AppState>();`,

    // No generics at all
    `const x: string = "hello";`,

    // Interface with generic
    `interface Container<T> { value: T; }`,

    // Type alias with proper types
    `type Response = Promise<{ data: User[] }>;`,
  ],

  invalid: [
    // Array<any>
    {
      code: `const items: Array<any> = [];`,
      errors: [{ messageId: "noAnyInGeneric" as const }],
    },

    // Record<string, any>
    {
      code: `const cache: Record<string, any> = {};`,
      errors: [{ messageId: "noAnyInGeneric" as const }],
    },

    // Map<string, any>
    {
      code: `const map: Map<string, any> = new Map();`,
      errors: [{ messageId: "noAnyInGeneric" as const }],
    },

    // Set<any>
    {
      code: `const set: Set<any> = new Set();`,
      errors: [{ messageId: "noAnyInGeneric" as const }],
    },

    // Promise<any>
    {
      code: `const promise: Promise<any> = fetch("/api");`,
      errors: [{ messageId: "noAnyInGeneric" as const }],
    },

    // Multiple any in same generic
    {
      code: `const map: Map<any, any> = new Map();`,
      errors: [
        { messageId: "noAnyInGeneric" as const },
        { messageId: "noAnyInGeneric" as const },
      ],
    },

    // Function parameter with generic any
    {
      code: `function process(items: Array<any>): void {}`,
      errors: [{ messageId: "noAnyInGeneric" as const }],
    },

    // Return type with generic any
    {
      code: `function getData(): Promise<any> { return fetch("/"); }`,
      errors: [{ messageId: "noAnyInGeneric" as const }],
    },

    // Generic function call with any
    {
      code: `const store = createStore<any>();`,
      errors: [{ messageId: "noAnyInGeneric" as const }],
    },

    // Nested — any inside outer generic
    {
      code: `const data: Map<string, Array<any>> = new Map();`,
      errors: [{ messageId: "noAnyInGeneric" as const }],
    },

    // Type alias with any in generic
    {
      code: `type Cache = Record<string, any>;`,
      errors: [{ messageId: "noAnyInGeneric" as const }],
    },

    // Qualified type name (e.g., React.ComponentProps<any>)
    {
      code: `type Props = React.ComponentProps<any>;`,
      errors: [{ messageId: "noAnyInGeneric" as const }],
    },
  ],
});
