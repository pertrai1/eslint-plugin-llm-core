# llm-core/consistent-catch-param-name

📝 Enforce consistent naming for catch clause parameters across the codebase.

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

LLMs frequently mix naming conventions (`e`, `err`, `error`, `ex`) in the same codebase. Consistent naming makes error handling patterns more recognizable, reduces cognitive load when reviewing AI-generated code, and makes search/refactoring easier.

By default the expected name is `"error"`. You can configure any valid identifier via the `name` option.

## Options

```json
{
  "llm-core/consistent-catch-param-name": ["error", { "name": "error" }]
}
```

| Option | Type   | Default   | Description                                       |
| ------ | ------ | --------- | ------------------------------------------------- |
| `name` | string | `"error"` | The required name for all catch clause parameters |

## What Counts

| Pattern                                         | Checked? |
| ----------------------------------------------- | -------- |
| `catch (e) {}`                                  | ✅ Yes   |
| `catch (err) {}`                                | ✅ Yes   |
| `catch (e: unknown) {}`                         | ✅ Yes   |
| `catch {}` (optional binding)                   | ❌ No    |
| `catch ({ message }) {}` (object destructuring) | ❌ No    |
| `catch ([a]) {}` (array destructuring)          | ❌ No    |

## Examples

### Incorrect

```ts
// "e" when "error" is expected (default)
try {
  doWork();
} catch (e) {
  console.error(e);
}

// "err" when "error" is expected
try {
  saveRecord();
} catch (err) {
  logger.error(err);
}

// Mixed names in the same file
try {
  doWork();
} catch (e) {
  console.error(e);
}
try {
  doMore();
} catch (err) {
  console.error(err);
}
```

### Correct

```ts
// Default option — "error"
try {
  doWork();
} catch (error) {
  console.error(error);
}

// Custom option — "err"
// eslint-config: ["error", { "name": "err" }]
try {
  doWork();
} catch (err) {
  console.error(err);
}

// Optional catch binding — not checked
try {
  doWork();
} catch {
  // intentionally suppressed
}

// Destructuring — not checked
try {
  doWork();
} catch ({ message }) {
  console.error(message);
}
```

## Error Messages

When the rule fires, the message teaches:

1. **What's wrong** — the catch parameter is named `'{{ actual }}'` but should be `'{{ expected }}'`
2. **Why** — LLMs mix naming conventions, making patterns harder to recognize and refactor
3. **How to fix** — rename the parameter from `{{ actual }}` to `{{ expected }}`

A suggestion fix is provided to rename the parameter and all its references within the catch block in a single editor action.

## When Not to Use It

If your team intentionally allows multiple catch variable names in different contexts, you can disable this rule or set it to `"warn"`.
