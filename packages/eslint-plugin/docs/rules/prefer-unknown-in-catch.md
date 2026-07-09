# llm-core/prefer-unknown-in-catch

📝 Disallow `any` type annotation on catch clause parameters; prefer `unknown`.

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`, ⌨️ `typescript`.

<!-- end auto-generated rule header -->

Disallow `catch (e: any)` — use `catch (e: unknown)` and narrow before accessing properties.

## Rule Details

LLMs often generate `catch (e: any)` to suppress TypeScript errors on `e.message` or `e.stack`. This defeats TypeScript's type safety entirely for that variable: you can pass it to typed functions, access non-existent properties, and trigger runtime errors with no compile-time warning.

Since TypeScript 4.0, `useUnknownInCatchVariables` (enabled by `strict`) makes catch parameters `unknown` by default. Explicitly annotating `any` overrides this protection.

This rule only targets catch clause parameters, not general `any` usage elsewhere. It complements `@typescript-eslint/no-explicit-any` without duplicating it.

## Examples

### Incorrect

```ts
try {
  await fetchData();
} catch (e: any) {
  // e.message compiles but is unsafe — e might not be an Error
  console.error(e.message);
}
```

### Correct

```ts
// Unknown + instanceof narrowing — safe
try {
  await fetchData();
} catch (e: unknown) {
  if (e instanceof Error) {
    console.error(e.message);
  } else {
    console.error(String(e));
  }
}

// No annotation needed (TS infers unknown under strict mode)
try {
  await fetchData();
} catch (e) {
  if (e instanceof Error) console.error(e.message);
}

// Reusable utility
function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error(String(e));
}

try {
  await fetchData();
} catch (e) {
  logger.error(toError(e));
}
```

## What This Rule Does NOT Flag

- `any` in function parameters, generics, or type aliases — those are outside this rule's scope
- Catch parameters with no annotation — TS's own `useUnknownInCatchVariables` handles that
- `catch (e: unknown)` — that is the correct pattern

## Error Messages

The error message teaches:

1. **What's wrong** — `any` disables type-safety for the caught value
2. **Why** — TS 4.0 made this `unknown` by default for good reason
3. **How to fix** — use `unknown` with `instanceof Error` narrowing or a `toError` helper
