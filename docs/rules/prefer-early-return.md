# llm-core/prefer-early-return

📝 Enforce guard clauses (early returns) instead of wrapping function bodies in a single if statement.

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Enforce guard clauses (early returns) instead of wrapping function bodies in a single if statement.

## Rule Details

LLMs consistently wrap entire function bodies in a single `if` statement instead of using guard clauses. This creates unnecessary nesting and obscures the main logic. Guard clauses handle edge cases at the top of the function, leaving the "happy path" at the base indentation level.

This rule complements `max-nesting-depth` by teaching the specific pattern that prevents deep nesting in the first place.

## Examples

### Incorrect

```ts
// Entire body wrapped in if — should use guard clause
function process(data: string) {
  if (isValid(data)) {
    transform(data);
    save(data);
  }
}

// If/else where else is a simple throw — invert to guard
function validate(input: string) {
  if (input.length > 0) {
    parse(input);
    process(input);
  } else {
    throw new Error("empty input");
  }
}

// Arrow function with wrapped body
const fetchUser = async (id: string) => {
  if (id) {
    const user = await db.find(id);
    return user;
  }
};
```

### Correct

```ts
// Guard clause — early return for the edge case
function process(data: string) {
  if (!isValid(data)) return;
  transform(data);
  save(data);
}

// Guard clause — early throw
function validate(input: string) {
  if (input.length === 0) throw new Error("empty input");
  parse(input);
  process(input);
}

// Guard clause in arrow function
const fetchUser = async (id: string) => {
  if (!id) return;
  const user = await db.find(id);
  return user;
};
```

## What This Rule Catches

The rule flags functions where:

1. The **only statement** in the function body is an `if` statement
2. The `if` body contains at least `minBodyStatements` statements (default: 2)
3. There is **no else**, or the else is a **single return/throw**

### What This Rule Does NOT Catch

- Functions with multiple statements before the `if` (only the wrapping pattern)
- `if/else` where both branches have substantial logic (genuine branching)
- `if/else if` chains (multiple conditions, not a simple guard)
- `if` bodies with fewer statements than the `minBodyStatements` threshold

## Options

### `minBodyStatements`

Minimum number of statements in the `if` body to trigger the rule. Default: `2`.

Setting this to `1` catches even simple cases like `if (x) { doSomething(); }`. Setting it higher reduces noise for shorter functions.

```json
{ "llm-core/prefer-early-return": ["error", { "minBodyStatements": 3 }] }
```

## Error Messages

The error message teaches the guard clause pattern:

1. **What's wrong** — the function body is wrapped in a single `if`
2. **Why** — unnecessary nesting obscures the main logic
3. **How to fix** — concrete before/after showing the inverted condition with early return
