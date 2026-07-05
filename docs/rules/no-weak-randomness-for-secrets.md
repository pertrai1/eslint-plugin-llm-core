# llm-core/no-weak-randomness-for-secrets

📝 Disallow weak or predictable randomness when creating security-sensitive values.

💼 This rule is enabled in the following configs: 🌐 `all`, 🏆 `best-practices`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Require cryptographic randomness when creating security-sensitive values such as tokens, sessions, nonces, salts, reset codes, API keys, and credentials.

LLM-generated code often reaches for `Math.random()`, timestamps, or counters because the result looks unique in demos. Those values are predictable and can make authentication or recovery flows guessable.

## Rule Details

This rule reports weak or predictable sources when the target name is security-sensitive:

- variable declarations such as `const token = Math.random()`
- assignments such as `user.apiKey = Math.random()`
- object properties such as `{ secret: Date.now().toString(36) }`
- sensitive generator functions such as `function generateToken() { return Math.random() }`

The default sensitive-name pattern covers `token`, `secret`, `password`, `sessionId`, `apiKey`, `nonce`, `salt`, `resetCode`, `verificationCode`, `authCode`, and `credential`. Non-security randomness is allowed by default so UI jitter, sampling, visual effects, and tests can still use `Math.random()`.

## Examples

### Incorrect

```ts
// Math.random is predictable and should not create auth tokens.
const token = Math.random().toString(36).slice(2);
```

```ts
// Timestamp-plus-random session IDs are still guessable.
const sessionId = `${Date.now()}-${Math.random()}`;
```

```ts
// Short reset codes from Math.random are easy to brute force.
const passwordResetCode = Math.floor(Math.random() * 1_000_000).toString();
```

```ts
// API keys must not use weak randomness.
user.apiKey = Math.random().toString(36);
```

### Correct

```ts
// Node: use cryptographic random bytes for token material.
import { randomBytes } from "node:crypto";

const token = randomBytes(32).toString("hex");
```

```ts
// Node: randomUUID is appropriate for session identifiers.
import { randomUUID } from "node:crypto";

const sessionId = randomUUID();
```

```ts
// Browser: use crypto.getRandomValues for random bytes.
const bytes = new Uint8Array(32);
crypto.getRandomValues(bytes);
const resetCode = encode(bytes);
```

```ts
// Non-security randomness is still allowed by default.
const displayJitter = Math.random() * 100;
```

## What Counts as Weak Randomness for Secrets

| Pattern                                              | Triggers? |
| ---------------------------------------------------- | --------- |
| `const token = Math.random().toString(36)`           | Yes       |
| `const sessionId = Date.now() + "-" + Math.random()` | Yes       |
| `` const nonce = `${Date.now()}-${counter++}` ``     | Yes       |
| `user.apiKey = Math.random().toString(36)`           | Yes       |
| `{ secret: new Date().getTime().toString(36) }`      | Yes       |
| `function generateToken() { return Math.random() }`  | Yes       |
| `const token = randomBytes(32).toString("hex")`      | No        |
| `const sessionId = randomUUID()`                     | No        |
| `crypto.getRandomValues(bytes)`                      | No        |
| `const displayJitter = Math.random() * 100`          | No        |

## Options

### `sensitiveNamePattern`

Override the default case-insensitive sensitive-name regular expression.

```ts
{
  "llm-core/no-weak-randomness-for-secrets": [
    "error",
    { "sensitiveNamePattern": "(token|inviteCode|apiKey)" }
  ]
}
```

### `allowMathRandomForNonSensitiveNames`

Defaults to `true`. Set to `false` to report `Math.random()` even when the target name is not security-sensitive.

### `checkFunctionReturnNames`

Defaults to `true`. Set to `false` to skip checks for sensitive function declarations such as `generateToken()` returning weak randomness.

## Error Messages

The error message teaches:

1. **What's wrong** — weak randomness is being used for a security-sensitive value
2. **Why** — predictable values compromise sessions, reset flows, API keys, nonces, and similar secrets
3. **How to fix** — use `crypto.randomBytes`, `crypto.randomUUID`, or browser `crypto.getRandomValues`
