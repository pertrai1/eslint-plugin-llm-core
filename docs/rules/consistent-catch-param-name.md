# llm-core/consistent-catch-param-name

📝 Enforce consistent naming for catch clause parameters across the codebase.

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Enforce consistent naming for catch clause parameters across the codebase.

## Rule Details

LLMs frequently mix naming conventions (`e`, `err`, `error`, `ex`) in the same codebase. Consistent naming makes error handling patterns more recognizable, reduces cognitive load when reviewing AI-generated code, and makes search/refactoring easier.

By default the expected name is `"error"`. You can configure any valid identifier via the `name` option.

Destructuring patterns in catch clauses (e.g. `catch ({ message })` or `catch ([a])`) are not checked by this rule.

Optional catch bindings without a parameter (`catch {}`) are also not checked.

## Options

```json
{
  "llm-core/consistent-catch-param-name": ["error", { "name": "error" }]
}
```

| Option | Type   | Default   | Description                                       |
| ------ | ------ | --------- | ------------------------------------------------- |
| `name` | string | `"error"` | The required name for all catch clause parameters |

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

// Optional catch binding — no parameter to check
try {
  doWork();
} catch {
  // intentionally suppressed
}

// Destructuring — not checked by this rule
try {
  doWork();
} catch ({ message }) {
  console.error(message);
}
```

## When Not to Use It

If your team intentionally allows multiple catch variable names in different contexts, you can disable this rule or set it to `"warn"`.
