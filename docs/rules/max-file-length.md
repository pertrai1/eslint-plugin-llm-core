# Enforce a maximum number of lines per file to encourage proper module separation (`llm-core/max-file-length`)

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Enforce a maximum number of lines per file to encourage proper module separation.

## Rule Details

LLMs frequently dump everything into a single file — handlers, utilities, types, constants. This rule limits file length, forcing proper module separation.

## Examples

### Incorrect

```ts
// god-file.ts — 500 lines of everything
export interface User { ... }
export interface Order { ... }
export const MAX_RETRIES = 3;
export const TIMEOUT = 5000;
export function validateUser() { ... }
export function validateOrder() { ... }
export function processUser() { ... }
export function processOrder() { ... }
// ... 400 more lines
```

### Correct

```ts
// types.ts
export interface User { ... }
export interface Order { ... }

// constants.ts
export const MAX_RETRIES = 3;
export const TIMEOUT = 5000;

// validation.ts
export function validateUser() { ... }
export function validateOrder() { ... }

// processing.ts
export function processUser() { ... }
export function processOrder() { ... }
```

## Options

### `max`

Maximum allowed lines per file. Default: `250`.

### `skipBlankLines`

Whether to skip blank lines when counting. Default: `true`.

### `skipTestFiles`

Whether to skip test files (`.test.ts`, `.spec.ts`, etc.). Default: `true`.

Test files are often longer than source files due to test setup and multiple test cases, so they are excluded by default.

```json
{
  "llm-core/max-file-length": [
    "error",
    {
      "max": 200,
      "skipBlankLines": true,
      "skipTestFiles": true
    }
  ]
}
```

## Error Messages

Error messages follow a structured teaching format designed for LLM self-correction:

1. **What's wrong** — identifies the file line count
2. **Why** — explains that large files indicate poor module separation
3. **How to fix** — four strategies: split by responsibility, extract related functions, separate types, separate constants
