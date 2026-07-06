# llm-core/no-dynamic-code-execution

📝 Disallow dynamic code execution through eval, Function constructors, and string-based timers.

💼 This rule is enabled in the following configs: 🌐 `all`, 🏆 `best-practices`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Disallow dynamic code execution APIs that compile strings as JavaScript. LLMs often use these APIs as shortcuts for configurable dispatch, plugin systems, expression evaluation, or timer callbacks, but they create injection risk and hide the allowed command surface from reviewers.

## Rule Details

This rule reports obvious, framework-agnostic dynamic execution patterns:

- direct `eval(...)`
- global member eval calls such as `window.eval(...)` and `globalThis.eval(...)`
- `new Function(...)`
- `Function(...)`
- `globalThis.Function(...)`
- `setTimeout(...)` and `setInterval(...)` when the first argument is a string or template literal

The rule intentionally does not try to prove whether a string is user-controlled. These APIs are unsafe-by-default and should be reviewed explicitly when they are truly unavoidable.

## Examples

### Incorrect

```ts
eval(userInput);

const fn = new Function("ctx", generatedBody);

const readEnv = globalThis.Function("return process.env");

setTimeout("refreshToken()", 1000);
setInterval(`poll()`, 5000);
```

### Correct

```ts
const handlers = {
  refreshToken,
  poll,
} satisfies Record<string, () => void>;

handlers[action]?.();

setTimeout(() => refreshToken(), 1000);
setInterval(() => poll(), 5000);
```

## What Counts as Dynamic Code Execution

| Pattern                         | Triggers? | Notes                                |
| ------------------------------- | --------- | ------------------------------------ |
| `eval(userInput)`               | Yes       | Direct string execution              |
| `window.eval(template)`         | Yes       | Global eval member call              |
| `new Function("return value")`  | Yes       | Function constructor compiles string |
| `Function("return value")`      | Yes       | Function constructor call            |
| `setTimeout("run()", 1000)`     | Yes       | String timer compiles code           |
| `setTimeout(() => run(), 1000)` | No        | Function callback                    |
| `handlers[action]?.()`          | No        | Explicit dispatch table              |
| `sandbox.eval(expression)`      | No        | Non-global object method             |

## Error Messages

The error message teaches:

1. **What's wrong** -- a string is being executed as code
2. **Why** -- dynamic execution creates injection risk and obscures valid behavior
3. **How to fix** -- use dispatch tables, callbacks, schema/config parsing, or explicit plugin registration instead of compiling strings
