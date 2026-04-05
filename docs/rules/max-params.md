# llm-core/max-params

📝 Enforce a maximum number of function parameters to encourage object parameter patterns.

💼 This rule is enabled in the following configs: 🌐 `all`, 🧮 `complexity`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Enforce a maximum number of function parameters to encourage object parameter patterns.

## Rule Details

LLMs frequently generate functions with many positional parameters. This makes function calls error-prone — parameter order is easy to confuse, and adding new parameters requires updating every call site.

This rule limits function parameters (default: 2) and encourages using a single options object with destructuring instead.

Constructors have a separate, higher limit (default: 5) to accommodate dependency injection patterns.

## Examples

### Incorrect

```ts
// Too many positional parameters
function fetchAttachment(
  url: string,
  logger: Logger,
  maxSizeBytes: number,
  timeoutMs: number,
  allowedDomains: string[],
  regulationId: string,
) {
  // ...
}
```

### Correct

```ts
// Object parameter with destructuring
type FetchOptions = {
  url: string;
  logger: Logger;
  maxSizeBytes: number;
  timeoutMs: number;
  allowedDomains: string[];
  regulationId: string;
};

function fetchAttachment(options: FetchOptions) {
  const { url, logger, maxSizeBytes, timeoutMs, allowedDomains, regulationId } =
    options;
  // ...
}
```

## Options

### `max`

Maximum allowed parameters for functions. Default: `2`.

### `maxConstructor`

Maximum allowed parameters for class constructors. Default: `5`.

```json
{
  "llm-core/max-params": [
    "error",
    {
      "max": 3,
      "maxConstructor": 10
    }
  ]
}
```

## Error Messages

Error messages follow a structured teaching format designed for LLM self-correction:

1. **What's wrong** — identifies the function and parameter count
2. **Why** — explains that positional parameters are error-prone
3. **How to fix** — shows the exact transformation to an options object with the function's actual parameter names
