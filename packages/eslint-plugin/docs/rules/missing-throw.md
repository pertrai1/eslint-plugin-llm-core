# llm-core/missing-throw

📝 Disallow standalone new Error expressions that likely forgot the throw keyword.

💼 This rule is enabled in the following configs: 🌐 `all`, 🏆 `best-practices`, ✅ `recommended`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## Rule details

This rule flags standalone `new Error(...)` expressions that create an Error object without throwing, returning, assigning, or otherwise using it. `new Error(...)` by itself does not stop execution. The autofix inserts the missing `throw` keyword before the Error construction.

Flagged patterns:

```js
function requireUser(user) {
  if (!user) {
    new Error("User is required");
  }
}

function parse(value) {
  if (typeof value !== "string") {
    new TypeError("Expected string");
  }
}

function collectErrors(errors) {
  new AggregateError(errors, "Multiple failures");
}
```

Correct patterns:

```js
function requireUser(user) {
  if (!user) {
    throw new Error("User is required");
  }
}

function createError() {
  return new Error("User is required");
}

const error = new Error("User is required");
```

## Scope and limitations

This rule uses AST-only analysis. It flags standalone construction of built-in Error constructors:

- `Error`
- `AggregateError`
- `EvalError`
- `RangeError`
- `ReferenceError`
- `SyntaxError`
- `TypeError`
- `URIError`

It intentionally does not flag arbitrary custom classes such as `new ValidationError(...)` because some codebases construct custom error objects as values and the rule cannot prove they are error subclasses without type information.
