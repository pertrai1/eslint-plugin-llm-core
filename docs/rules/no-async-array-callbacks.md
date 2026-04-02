# Disallow async callbacks passed to array methods where Promises are silently discarded or misused (`llm-core/no-async-array-callbacks`)

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Disallow passing async functions to array methods where the returned Promises are silently discarded or semantically wrong.

## Rule Details

LLMs frequently write `items.forEach(async (item) => { await ... })` or `items.filter(async (item) => { return await check(item) })` assuming the method understands async callbacks. It doesn't — these methods are synchronous and either ignore the return value (forEach) or receive a Promise object where a boolean was expected (filter, some, every).

### Methods that always flag async callbacks

| Method    | Why async is wrong                                              |
| --------- | --------------------------------------------------------------- |
| `forEach` | Return value is always ignored; Promises are silently discarded |
| `filter`  | Receives a truthy Promise object, not the resolved boolean      |
| `some`    | Receives a truthy Promise, always returns `true`                |
| `every`   | Receives a truthy Promise, always returns `true`                |
| `reduce`  | Accumulator becomes a Promise, chaining breaks silently         |
| `flatMap` | Returns an array of Promises instead of flattened values        |

### `map` — conditional flagging

`items.map(async ...)` returns an array of Promises. This rule only allows that pattern when the result is **immediately awaited or returned** through `Promise.all(...)` or `Promise.allSettled(...)`. The rule flags async map callbacks in all other contexts.

## Examples

### Incorrect

```ts
// forEach: Promises are silently discarded
items.forEach(async (item) => {
  await processItem(item);
});

// filter: resolves to [Promise, Promise, ...] not booleans
const active = items.filter(async (item) => {
  return await isActive(item);
});

// map without Promise.all: returns array of unresolved Promises
const results = items.map(async (item) => {
  return await fetchData(item);
});

// Promise.all without await/return still drops the outer promise
Promise.all(
  items.map(async (item) => {
    return await fetchData(item);
  }),
);
```

### Correct

```ts
// Sequential with for...of
for (const item of items) {
  await processItem(item);
}

// Parallel with Promise.all — the documented safe pattern for map
await Promise.all(
  items.map(async (item) => {
    return await processItem(item);
  }),
);

// Synchronous callbacks are always fine
items.forEach((item) => process(item));
items.filter((item) => item.active);
```

## What This Rule Does NOT Catch

- Named function references (e.g., `forEach(processItem)`) — cannot determine if the referenced function is async without type information
- Async callbacks on named function references stored elsewhere

## Syntax-Only Limitation

This rule is intentionally syntax-only. It looks for familiar method names like `.forEach()`, `.filter()`, or `.map()` and does **not** use type information to prove that the receiver is a real JavaScript array.

That means custom collection APIs that intentionally expose array-like method names may also be flagged. If your codebase relies on async-aware custom collections, scope or disable this rule for those files.

## Error Messages

Two distinct messages are used:

1. **`noAsyncArrayCallback`** — for forEach, filter, some, every, reduce, flatMap: teaches that Promises are discarded or misused and offers concrete alternatives
2. **`noAsyncMapCallback`** — for map without immediate await/return through `Promise.all(...)`: teaches the `await Promise.all(items.map(...))` pattern
