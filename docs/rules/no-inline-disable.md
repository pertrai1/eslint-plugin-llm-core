# llm-core/no-inline-disable

📝 Disallow eslint-disable comments that suppress lint errors instead of fixing them.

💼 This rule is enabled in the following configs: 🌐 `all`, 🧹 `hygiene`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Disallow eslint-disable comments that suppress lint errors instead of fixing them.

## Rule Details

LLMs frequently add `// eslint-disable-next-line` or `/* eslint-disable */` comments to silence lint errors rather than fixing the underlying code. This bypasses all other lint rules, defeating the purpose of linting.

This rule catches:

- `// eslint-disable-next-line`
- `// eslint-disable-line`
- `/* eslint-disable ... */`
- `/* eslint-enable ... */`

## Examples

### Incorrect

```ts
// eslint-disable-next-line no-unused-vars
const x = 1;

/* eslint-disable no-console */
console.log("debug");
/* eslint-enable no-console */

const y = 1; // eslint-disable-line no-unused-vars
```

### Correct

```ts
// Fix the code instead of disabling the rule
const x = computeValue();
useValue(x);

// Use a proper logger instead of console
logger.debug("debug info", { context });

// If a rule doesn't apply to certain files, configure it in eslint.config.mjs
// instead of disabling inline
```

## Why No Escape Hatches?

When an LLM encounters a lint error, it has two options:

1. Fix the code to satisfy the rule
2. Add a disable comment to suppress the error

Option 2 is always easier, so LLMs default to it. This rule removes that escape hatch, forcing the LLM to actually fix the code — which is the entire point of linting.

## Error Messages

Error messages follow a structured teaching format designed for LLM self-correction:

1. **What's wrong** — identifies the specific disable comment
2. **Why** — explains that suppressing rules hides problems
3. **How to fix** — three alternatives: fix the code, configure the rule properly, or refactor
