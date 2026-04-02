# Disallow `any` as a generic type argument in type references, arrays, and other parameterized types (`llm-core/no-any-in-generic`)

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Disallow `any` as a generic type argument in type references like `Array<any>`, `Record<string, any>`, `Map<string, any>`, and other parameterized types.

## Rule Details

LLMs frequently use `any` inside generic types as a "good enough" placeholder. Unlike bare `any` annotations, this pattern is subtler — the code looks typed because there's a generic wrapper, but `any` silently leaks through every access, assignment, and function call that touches the contained values.

## Examples

### Incorrect

```ts
// any leaks into every array access
const items: Array<any> = [];

// any leaks into every property access
const cache: Record<string, any> = {};

// any leaks into every map.get() call
const lookup: Map<string, any> = new Map();

// any leaks into the resolved value
const promise: Promise<any> = fetch("/api");

// any in generic function calls
const store = createStore<any>();
```

### Correct

```ts
// Specific types
const items: Array<User> = [];
const cache: Record<string, CacheEntry> = {};
const lookup: Map<string, Handler> = new Map();
const promise: Promise<Response> = fetch("/api");

// unknown when the type is genuinely dynamic
const items: Array<unknown> = [];
const cache: Record<string, unknown> = {};

// Narrow unknown values with type guards
for (const item of items) {
  if (isUser(item)) {
    process(item); // TypeScript knows it's a User
  }
}
```

## What This Rule Catches

The rule flags `any` used as a type argument in:

1. **Type references** — `Array<any>`, `Record<string, any>`, `Map<any, any>`, `Set<any>`, `Promise<any>`, custom generics
2. **Generic function calls** — `createStore<any>()`, `useState<any>()`
3. **Multiple `any` arguments** — `Map<any, any>` reports two errors

### What This Rule Does NOT Catch

- `any` in type annotations (`const x: any`) — use `@typescript-eslint/no-explicit-any` for this
- `any` in type assertions (`value as any`) — use `llm-core/no-type-assertion-any` for this
- Generic type parameter definitions (`interface Foo<T = any>`) — these define defaults, not usage

## Error Messages

The error message teaches the proper alternative:

1. **What's wrong** — `any` inside a generic disables type checking for contained values
2. **Why** — the `any` leaks into every access and assignment through the container
3. **How to fix** — use a specific type, or `unknown` with type guards for dynamic data
