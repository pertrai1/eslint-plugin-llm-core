# Disallow passing async functions to Array.prototype.forEach (`llm-core/no-async-foreach`)

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Disallow passing async functions to `Array.prototype.forEach`.

## Rule Details

LLMs routinely write `items.forEach(async (item) => { await ... })` assuming the iterations run sequentially. They don't — `forEach` ignores the return value of its callback, so each returned Promise is silently discarded. This leads to unhandled rejections, race conditions, and code that appears to work but executes in an unpredictable order.

## Examples

### Incorrect

```ts
// Promises are silently discarded — no await, no error handling
items.forEach(async (item) => {
  await processItem(item);
});

// Looks like sequential execution, but it's fire-and-forget
users.forEach(async (user) => {
  const profile = await fetchProfile(user.id);
  await updateCache(user.id, profile);
});
```

### Correct

```ts
// Sequential execution with for...of
for (const item of items) {
  await processItem(item);
}

// Parallel execution with Promise.all
await Promise.all(
  items.map(async (item) => {
    await processItem(item);
  }),
);

// Synchronous forEach is fine
items.forEach((item) => {
  process(item);
});
```

## What This Rule Catches

The rule flags `forEach` calls where the callback is:

1. An **async arrow function** — `forEach(async (item) => { ... })`
2. An **async function expression** — `forEach(async function(item) { ... })`

### What This Rule Does NOT Catch

- Named function references passed to forEach (e.g., `forEach(processItem)`) — even if the function is async, static analysis cannot always determine this without type information
- Async callbacks in `.map()`, `.filter()`, or other array methods — these have different semantics

## Error Messages

The error message teaches the correct patterns:

1. **What's wrong** — async function passed to forEach, Promises are discarded
2. **Why** — forEach ignores return values, causing silent failures
3. **How to fix** — use `for...of` for sequential or `Promise.all` with `.map()` for parallel
