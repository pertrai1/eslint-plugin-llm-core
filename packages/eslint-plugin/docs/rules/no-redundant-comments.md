# llm-core/no-redundant-comments

📝 Disallow comments that merely narrate the next line of code without adding intent.

💼 This rule is enabled in the following configs: 🌐 `all`, 🧹 `hygiene`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Disallow comments that merely narrate adjacent code instead of explaining intent, constraints, or non-obvious behavior.

## Rule Details

LLMs often add conversational comments that describe the next line of code in plain English: `// Validate the input`, `// Return the result`, or `// Check if the user exists`. These comments do not preserve design intent. They make files noisier and train future edits to keep narrating implementation mechanics instead of documenting why the code exists.

This rule reports narrow, high-confidence cases where a line comment immediately precedes code that already says the same thing.

## Examples

### Incorrect

```ts
// Validate the user input
validateUser(input);

// Return the result
return result;

// Check if the user exists
if (user) {
  activateUser(user);
}

// Set the user name
user.name = name;
```

### Correct

```ts
// Reject webhook payloads before persistence because they are untrusted
validateWebhookPayload(payload);

// Only return cached data when the caller accepts stale results
return cache.get(key);

// This branch handles retry after a 429 response
if (shouldRetry(response)) {
  retry();
}
```

## What Counts as a Redundant Comment

| Pattern                                                        | Triggers? |
| -------------------------------------------------------------- | --------- |
| `// Return the result` before `return result`                  | Yes       |
| `// Validate the user input` before `validateUser(input)`      | Yes       |
| `// Set the user name` before `user.name = name`               | Yes       |
| `// Validate before persisting because payloads are untrusted` | No        |
| `// TODO(#123): add request tracing`                           | No        |
| JSDoc API documentation                                        | No        |
| ESLint or TypeScript directive comments                        | No        |

## Error Messages

The error message teaches:

1. **What's wrong** -- the comment narrates adjacent code without adding intent
2. **Why** -- conversational comments are common LLM noise and reduce maintainability
3. **How to fix** -- delete the comment or rewrite it to explain why, constraints, or tradeoffs
