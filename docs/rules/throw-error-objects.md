# llm-core/throw-error-objects

📝 Disallow throwing non-Error values such as strings, template literals, plain objects, or arrays.

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Disallow throwing string literals, template literals, plain objects, arrays, or other non-Error values.

## Rule Details

LLMs often generate `throw "something went wrong"` or `throw { code: 404 }` as a shorthand. These patterns lose the stack trace, break `e instanceof Error` checks, and cause silent failures in logging and error-reporting tools that expect an `Error` object.

This is a syntax-only rule and does not require type information. It allows `throw` of identifiers, member expressions, call expressions, and `new` expressions because it cannot statically prove their type — those forms are assumed to be Error instances or safe wrappers.

## Examples

### Incorrect

```ts
// String literal — no stack trace
throw "something went wrong";

// Template literal — still no stack trace
throw `failed to connect to ${host}`;

// Plain object — instanceof Error fails, .stack is undefined
throw { code: 404, message: "not found" };

// Array — completely wrong type
throw ["validation", "failed"];

// Number
throw 500;
```

### Correct

```ts
// Error instance — stack trace, instanceof, .message all work
throw new Error("something went wrong");

// Error subclass
throw new ValidationError("invalid input");

// Identifier — may hold an Error, allowed
throw err;

// Call expression — assumed to create a proper Error
throw createError("context", { cause: err });

// Enrich an existing error with context
throw Object.assign(new Error("not found"), { code: 404 });
```

## What This Rule Does NOT Flag

- `throw identifier` — the identifier may hold an Error; type-checking would be needed to verify
- `throw expr.property` — same reason
- `throw callExpression()` — assumed to return an Error
- `throw new SomeThing()` — assumed to construct an Error

## Error Messages

The error message teaches:

1. **What's wrong** — the thrown value is not an Error instance
2. **Why** — stack traces are lost, catch handlers receive unexpected types
3. **How to fix** — `new Error(msg)`, `Object.assign(new Error(...), extras)`, or Error subclasses
