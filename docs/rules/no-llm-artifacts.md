# llm-core/no-llm-artifacts

📝 Disallow common LLM placeholder comments and incomplete code markers that indicate skipped implementation.

💼 This rule is enabled in the following configs: 🌐 `all`, `hygiene`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Disallow common LLM placeholder comments and stub function bodies that indicate incomplete code generation.

## Rule Details

LLMs frequently save tokens by outputting placeholder comments like `// ... existing code ...`, `// TODO: implement`, or `// rest of the function remains the same` instead of writing the actual code. When applied automatically by an agent, these placeholders silently replace real logic with nothing.

This rule detects two categories of LLM artifacts:

1. **Placeholder comments** — Comments that indicate skipped or abbreviated code
2. **Stub function bodies** — Functions whose only statement is `throw new Error("Not implemented")`

## Examples

### Incorrect

```ts
/* eslint llm-core/no-llm-artifacts: "error" */

// ... existing code ...
function processData(items: Item[]) {
  // implementation goes here
}

// rest of the function remains the same

function validate(input: string) {
  throw new Error("Not implemented");
}

// abbreviated for brevity
// add error handling as needed
```

### Correct

```ts
/* eslint llm-core/no-llm-artifacts: "error" */

// This function processes items by filtering and transforming
function processData(items: Item[]) {
  return items.filter(isValid).map(transform);
}

// TODO(#123): add caching for repeated lookups
function validate(input: string) {
  if (!input.trim()) {
    throw new Error("Input must not be empty");
  }
  return schema.parse(input);
}
```

## Detected Patterns

### Placeholder Comments

| Pattern                | Example                                                    |
| ---------------------- | ---------------------------------------------------------- |
| Ellipsis placeholders  | `// ... existing code ...`, `// ...rest of the code...`    |
| "Remains the same"     | `// rest of the function remains the same`                 |
| Lazy TODO              | `// TODO: implement`, `// TODO implement`                  |
| "Code here" markers    | `// add implementation here`, `// your code here`          |
| "As needed" deferrals  | `// add error handling as needed`                          |
| Brevity markers        | `// abbreviated for brevity`, `// omitted for clarity`     |
| Reference to elsewhere | `// similar to above`, `// same as before`                 |
| "Continue here"        | `// continue from here`, `// continue implementation here` |
| "See above/below"      | `// see implementation above`, `// see above for details`  |

### Stub Function Bodies

Functions whose only statement is `throw new Error(msg)` where `msg` matches "not implemented" or "TODO: implement" (case-insensitive).

## What This Rule Allows

- **Specific TODOs** — `// TODO(#123): validate input against schema` (has actionable context)
- **Prose comments** — `// This handles the edge case where input is empty`
- **Legitimate throws** — `throw new Error("XML format is not supported")` (real error, not a placeholder)
- **Functions with real logic** — Even if they contain a "not implemented" throw alongside other statements

## Error Messages

### `noLlmArtifact`

> LLM placeholder detected: '...'. Replace with actual implementation.

Fired for placeholder comments. The message explains that these comments replace real logic when applied, and suggests writing specific TODOs if work must be deferred.

### `notImplementedStub`

> Function body is a 'not implemented' stub — write the actual implementation.

Fired for functions whose sole body is a "not implemented" throw. The message explains that these stubs pass type checks but fail at runtime.
