# llm-core/no-debug-scaffolding

📝 Disallow temporary debugger statements and console debug scaffolding left behind during development.

💼 This rule is enabled in the following configs: 🌐 `all`, 🧹 `hygiene`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Disallow temporary `debugger` statements and console debug probes that are commonly left behind by LLM-assisted edits.

## Rule Details

LLMs often debug by inserting ad-hoc `console.log` calls or `debugger` statements and then fail to remove them. These probes make code noisier, can expose sensitive runtime data, and rarely become intentional observability.

This rule targets high-confidence scaffolding rather than every possible console call. It reports:

- `debugger` statements
- empty `console.log`, `console.debug`, and `console.trace` calls
- console probes with temporary labels such as `debug`, `here`, `TODO remove`, or `response`
- raw dumps of identifiers, objects, arrays, member expressions, or function calls through `console.log`, `console.debug`, or `console.trace`

It does not replace `structured-logging`; that rule handles dynamic log messages. This rule catches the temporary debug residue that should be deleted or intentionally converted into project logging.

## Examples

### Incorrect

```ts
debugger;

console.log("debug", value);
console.log("here");
console.debug("response", response);
console.trace("trace", value);
console.log(user);
console.log({ user });
console.log(getState());
console.log("TODO remove", result);
```

### Correct

```ts
console.error("Failed to save user", error);
console.warn("Deprecated API used", { route });
console.info("Migration complete", { rows });
console.log("Server started");
console.log("Processed batch", { batchId, count });

logger.debug("Cache hit", { key });
audit.log("User authenticated", { userId });
```

## Non-goals

| Pattern                                           | Reason                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `console.error(...)` and `console.warn(...)`      | Often intentional CLI/script diagnostics or error reporting                                |
| Meaningful static `console.log("Server started")` | Not enough signal to call it temporary scaffolding                                         |
| `logger.debug(...)`                               | Project logger calls should be governed by logging policy, not console-scaffolding cleanup |
| Dynamic console messages                          | Covered by `structured-logging`                                                            |
| Shadowed local `console` variables                | Not the global console API                                                                 |

## Error Messages

The error messages teach:

1. **What's wrong** -- a debugger statement, temporary console marker, or raw console dump remains
2. **Why** -- this is likely debug-session residue and weak observability
3. **How to fix** -- delete it or convert intentional telemetry to structured logging
