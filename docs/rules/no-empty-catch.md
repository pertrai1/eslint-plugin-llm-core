# Disallow catch blocks with no meaningful error handling (empty or comment-only blocks) (`llm-core/no-empty-catch`)

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Disallow `catch` blocks that are empty, comment-only, or contain only empty statements such as `;`.

## Rule Details

LLMs frequently generate empty catch blocks or catch blocks with only a comment like `// ignore`. This silently swallows errors, making bugs invisible and systems degrade without warning. Even when error suppression is intentional, an empty block gives future readers no signal that the omission was deliberate.

A catch block is considered **meaningful** when it contains at least one executable statement: a log call, a `throw`, a `return`, a variable assignment, or any other expression statement.

A catch block containing **only comments** (including `// intentional`) is flagged — a comment is documentation, not handling. A block containing only semicolons is also flagged, because `;` performs no handling.

## Examples

### Incorrect

```ts
// Empty — errors are completely hidden
try {
  await fetchData();
} catch (e) {}

// Comment-only — no actual handling
try {
  await saveRecord();
} catch (e) {
  // TODO: handle this
}

// Semicolon-only — still no handling
try {
  await saveRecord();
} catch {}
```

### Correct

```ts
// Log and continue
try {
  await sendNotification(user);
} catch (e) {
  logger.error("notification failed", e);
}

// Rethrow with context
try {
  await writeFile(path, data);
} catch (e) {
  throw new Error(`failed to write ${path}`, { cause: e });
}

// Return a safe default
function safeParse(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Rethrow is meaningful — the catch was used for cleanup
try {
  await tx.begin();
  await doWork();
} catch (e) {
  await tx.rollback();
  throw e;
}
```

## What Counts as Meaningful

| Statement in catch body             | Meaningful? |
| ----------------------------------- | ----------- |
| `throw e` / `throw new Error(...)`  | ✅ Yes      |
| `return` / `return null`            | ✅ Yes      |
| `logger.error(e)` or any expression | ✅ Yes      |
| `const msg = e.message`             | ✅ Yes      |
| `// comment` only                   | ❌ No       |
| `;` only                            | ❌ No       |
| empty `{}`                          | ❌ No       |

## Error Messages

The error message teaches:

1. **What's wrong** — catch block silently swallows errors
2. **Why** — failures become invisible, debugging is impossible
3. **How to fix** — log, rethrow, return default, or document with a real statement
