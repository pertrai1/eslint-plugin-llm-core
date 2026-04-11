# llm-core/no-swallowed-errors

📝 Disallow catch blocks that only log to console and swallow the error.

💼 This rule is enabled in the following configs: 🌐 `all`, 🏆 `best-practices`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Disallow `catch` blocks that only call `console.log`, `console.warn`, `console.error`, or `console.debug` without rethrowing, returning, or delegating the failure to a real error handler.

## Rule Details

LLMs often generate placeholder error handling like `catch (error) { console.error(error); }`. That looks intentional, but it still swallows the failure: callers do not see an error, control flow continues, and production systems quietly drift into bad state.

This rule focuses on the narrow, high-signal case where a non-empty `catch` block contains **only console logging calls**. It deliberately does **not** overlap with `no-empty-catch` — truly empty or comment-only blocks belong to that rule.

## Examples

### Incorrect

```ts
try {
  await processOrder(order);
} catch (error) {
  console.error(error);
}

try {
  await loadConfig();
} catch (error) {
  console.warn("Config failed", error);
  console.debug(error);
}
```

### Correct

```ts
try {
  await processOrder(order);
} catch (error) {
  throw new Error("Failed to process order", { cause: error });
}

try {
  return await loadConfig();
} catch (error) {
  logger.error("Config load failed", { error });
  return null;
}

try {
  await publishEvent(event);
} catch (error) {
  Sentry.captureException(error);
}

try {
  await performWork();
} catch (error) {
  console.error(error);
  throw error;
}
```

## What This Rule Flags

| Catch body contents                             | Flagged? |
| ----------------------------------------------- | -------- |
| `console.error(error)`                          | ✅ Yes   |
| `console.log(error); console.warn("failed", e)` | ✅ Yes   |
| `console.error(error); throw error;`            | ❌ No    |
| `console.error(error); handleError(error);`     | ❌ No    |
| `handleError(error)`                            | ❌ No    |
| empty `catch {}`                                | ❌ No    |

## Why Console-Only Handling Is Risky

- Logging alone does not change control flow.
- Callers cannot recover because they never learn the operation failed.
- Background tasks can keep running with partial or invalid state.
- The code looks "handled" in review even though the failure was dropped.

## Error Messages

The teaching message explains:

1. **What's wrong** — the catch block only logs and swallows the error
2. **Why** — execution continues as if nothing failed
3. **How to fix** — rethrow, return an explicit fallback, or delegate to a real handler such as a logger or error tracker
