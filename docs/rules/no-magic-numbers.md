# llm-core/no-magic-numbers

📝 Disallow magic numbers and enforce named constants for clarity.

💼 This rule is enabled in the following configs: 🌐 `all`, 🏆 `best-practices`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Disallow magic numbers and enforce named constants for clarity.

## Rule Details

LLMs scatter hardcoded numbers throughout generated code — timeouts, limits, sizes, retry counts — without explaining what they represent. This rule forces numbers to be extracted into named constants.

## Examples

### Incorrect

```ts
if (retries > 5) {
  throw new Error("Too many retries");
}

setTimeout(callback, 3000);

if (file.size > 1048576) {
  throw new Error("File too large");
}
```

### Correct

```ts
const MAX_RETRIES = 5;
if (retries > MAX_RETRIES) {
  throw new Error("Too many retries");
}

const RETRY_DELAY_MS = 3000;
setTimeout(callback, RETRY_DELAY_MS);

const MAX_FILE_SIZE_BYTES = 1048576;
if (file.size > MAX_FILE_SIZE_BYTES) {
  throw new Error("File too large");
}
```

## What This Rule Allows

By default, these are permitted without named constants:

- **`0`, `1`, `-1`, `2`** — ubiquitous in loops, checks, and arithmetic
- **Array indexes** — `items[3]` (configurable)
- **Default parameter values** — `function retry(attempts = 3)` (configurable)
- **Enum initializers** — `enum Status { Active = 10 }` (configurable)
- **Type contexts** — type-level numeric literals
- **Const declarations** — `const MAX = 5` (this IS the named constant)

## Options

### `ignore`

Numbers to allow without named constants. Default: `[0, 1, -1, 2]`.

### `ignoreArrayIndexes`

Allow numbers as computed array/object indexes. Default: `true`.

### `ignoreDefaultValues`

Allow numbers as default parameter values. Default: `true`.

### `ignoreEnums`

Allow numbers in enum initializers. Default: `true`.

### `skipTestFiles`

Whether to skip test files (`.test.ts`, `.spec.ts`, etc.). Default: `true`.

Test files are full of numeric literals in assertions — `expect(sum(2, 3)).toBe(5)` — where extracting to constants hurts readability.

### `ignoreObjectProperties`

Allow numbers used as object literal property values. Default: `false`.

Useful for data files like pricing tables, model config maps, and HTTP status maps where the values **are** the data:

```ts
// With ignoreObjectProperties: true — no errors
const PRICING = { basic: 9.99, pro: 29.99, enterprise: 99.99 };
const HTTP_STATUS = { BAD_REQUEST: 400, NOT_FOUND: 404 };
```

Numbers outside object literals are still flagged even with this option enabled. This only applies to object literal property values (`ObjectExpression`) — destructuring defaults like `function f({ timeout = 5000 }) {}` are still flagged.

```json
{
  "llm-core/no-magic-numbers": [
    "error",
    {
      "ignore": [0, 1, -1, 2, 100],
      "ignoreArrayIndexes": true,
      "ignoreDefaultValues": true,
      "ignoreEnums": true,
      "skipTestFiles": true,
      "ignoreObjectProperties": true
    }
  ]
}
```

## Error Messages

Error messages follow a structured teaching format designed for LLM self-correction:

1. **What's wrong** — identifies the specific magic number
2. **Why** — explains that readers can't tell what the number represents
3. **How to fix** — shows a before/after extraction to a named constant using the actual number
