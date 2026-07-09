# llm-core/no-floating-promise

📝 Disallow calling async functions or Promise-returning expressions without awaiting, returning, or explicitly voiding the result.

💼 This rule is enabled in the following configs: 🌐 `all`, 🏆 `best-practices`, ✅ `recommended`.

<!-- end auto-generated rule header -->

## Rule Details

LLMs frequently call async functions and drop the returned Promise. A floating Promise loses its rejection (turning into an unhandled promise rejection), breaks execution ordering, and is one of the most common async bugs in generated code.

This rule flags three AST-detectable patterns at statement position, without requiring TypeScript type information:

1. **Async function references** — a call whose callee resolves, in the current file, to an `async function` declaration or a variable initialized to an async arrow/function expression.
2. **Promise factory calls** — `Promise.all`, `Promise.allSettled`, `Promise.race`, `Promise.any`, `Promise.resolve`, and `Promise.reject`.
3. **Unhandled `.then()` chains** — a top-level `.then(handler)` call with fewer than two arguments (so the rejection path has no handler).

The rule fires only when the call is the expression of an `ExpressionStatement`. Calls consumed by `await`, `return`, `void`, a variable declarator, or an assignment are not statements and are never flagged.

## When Not To Use It

This rule uses AST heuristics, not TypeScript's type checker. If your project enables `@typescript-eslint/no-floating-promises` with full type information, prefer that rule — it catches strictly more floating Promises. Use this rule when a type-aware lint is not available, or as an additional teaching-message layer on top.

## Examples

### Incorrect

```ts
async function saveData() {
  /* ... */
}

// Async function call at statement position — result is discarded
saveData();

// Promise factory at statement position
Promise.all([p1, p2]);

// .then() chain without a rejection handler
fetchData().then((data) => process(data));
```

### Correct

```ts
async function saveData() {
  /* ... */
}

// Await the result
await saveData();

// Return it to the caller
async function run() {
  return saveData();
}

// Store for later awaiting
async function run() {
  const p = saveData();
  await p;
}

// Explicit fire-and-forget
void saveData();

// Attach a rejection handler
saveData().catch((error) => logger.error("save failed", error));

// Two-argument .then() handles both paths
fetchData().then(handle, onError);

// Chain ends with .catch()
fetchData()
  .then(handle)
  .catch((error) => logger.error(error));
```

## Detected Patterns

| Pattern at statement position            | Flagged? |
| ---------------------------------------- | -------- |
| `asyncFn();` (declared async in scope)   | Yes      |
| `Promise.all([p1, p2]);`                 | Yes      |
| `Promise.resolve(x);`                    | Yes      |
| `foo().then(handler);`                   | Yes      |
| `foo().then(handler, onError);`          | No       |
| `foo().catch(handler);`                  | No       |
| `foo().then(handler).catch(onError);`    | No       |
| `void asyncFn();`                        | No       |
| `await asyncFn();` / `return asyncFn();` | No       |

## Error Messages

The error message teaches:

1. **What's wrong** — the returned Promise at statement position is discarded
2. **Why** — dropped Promises lose their rejection and break execution ordering
3. **How to fix** — `await`, `return`, `void`, or attach `.catch(...)`
