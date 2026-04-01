# Enforce structured logging with static messages and dynamic values as separate metadata (`llm-core/structured-logging`)

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Enforce structured logging with static messages and dynamic values as separate metadata.

## Rule Details

LLMs frequently interpolate dynamic values directly into log messages using template literals or string concatenation. This breaks log aggregation, prevents filtering, and can leak sensitive data into log messages.

This rule enforces that logging functions receive static string messages, with dynamic values passed as structured metadata in separate arguments.

## Examples

### Incorrect

```ts
// Template literals with dynamic values
console.error(`Failed to fetch data for user ${userId}`);
logger.error(`Request ${requestId} failed with ${statusCode}`);
logError(`Processing failed: ${error.message}`);
logException(error, `Request ${requestId} timed out`);

// String concatenation
console.log("User " + userId + " logged in");
logger.warn("Slow query: " + duration + "ms");
```

### Correct

```ts
// Static messages with structured metadata
console.error("Failed to fetch data", { userId });
logger.error("Request failed", { requestId, statusCode });
logError("Processing failed", { error: error.message });
logException(error, "Request timed out", { requestId });

// Static template literals (no expressions) are fine
console.log(`Server started`);
logger.info("User logged in", { userId });
```

## Options

### `logFunctions`

Array of standalone function names to check. Default:

```json
["logError", "logInfo", "logWarn", "logDebug", "logException"]
```

### `logMethods`

Array of method names to check when called on any object (e.g., `logger.error`, `console.warn`). Default:

```json
["log", "info", "warn", "error", "debug", "trace"]
```

### Example Configuration

```json
{
  "llm-core/structured-logging": [
    "error",
    {
      "logFunctions": ["logError", "logInfo", "customLog"],
      "logMethods": ["log", "info", "warn", "error", "write"]
    }
  ]
}
```

**Note:** Setting either option replaces the defaults entirely — it does not merge with them.

## What This Rule Does NOT Flag

- Static string messages (no interpolation or concatenation)
- Template literals without expressions
- Dynamic values passed as metadata arguments (second, third, etc.)
- Non-logging function calls (e.g., `throw new Error(\`Not found: ${id}\`)`)
- Non-string arguments (numbers, objects)
- Functions/methods not in the configured lists

## Error Messages

Error messages follow a structured teaching format designed for LLM self-correction:

1. **What's wrong** — log message contains dynamic values
2. **Why** — dynamic messages break log aggregation and filtering
3. **How to fix** — shows how to extract dynamic values into structured metadata
