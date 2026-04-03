# llm-core/max-nesting-depth

📝 Enforce a maximum nesting depth for control flow statements to reduce cognitive complexity.

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Enforce a maximum nesting depth for control flow statements to reduce cognitive complexity.

## Rule Details

LLMs frequently generate deeply nested code instead of using guard clauses, early returns, or extracting helper functions. This rule limits how deep control flow can nest, forcing flatter, more readable code.

Nesting is counted for: `if`, `for`, `for...in`, `for...of`, `while`, `do...while`, `switch`, and `try`.

**`else if` is not counted as additional nesting** — it reads as a flat chain, not a deeper level.

## Examples

### Incorrect

```ts
// Depth 4 — exceeds default max of 3
if (user) {
  if (user.isActive) {
    for (const item of user.items) {
      if (item.isValid) {
        // ← depth 4, error
        process(item);
      }
    }
  }
}
```

### Correct

```ts
// Guard clauses flatten nesting
if (!user) return;
if (!user.isActive) return;

for (const item of user.items) {
  if (item.isValid) {
    process(item);
  }
}

// Or extract helpers
function processActiveItems(user: User) {
  for (const item of user.items) {
    if (item.isValid) {
      process(item);
    }
  }
}

if (user?.isActive) {
  processActiveItems(user);
}
```

## Options

### `max`

Maximum allowed nesting depth. Default: `3`.

```json
{ "llm-core/max-nesting-depth": ["error", { "max": 4 }] }
```

## Error Messages

The error message teaches three specific refactoring techniques:

1. **Guard clauses** — invert conditions and return early to avoid wrapping
2. **Extract helpers** — pull nested blocks into named functions
3. **Flatten chains** — replace nested if/else with early returns or lookups

## Complementary Tools

For full cognitive complexity scoring (including logical operators, recursion, and break/continue), consider adding [`eslint-plugin-sonarjs`](https://github.com/SonarSource/eslint-plugin-sonarjs) with its `cognitive-complexity` rule.
