# eslint-plugin-llm-core

ESLint rules that catch the patterns LLM agents get wrong — and teach them to self-correct through structured error messages.

LLMs generate code that _works_ but drifts: arrow functions everywhere, magic numbers, deep nesting, string-interpolated logs, oversized files. These aren't style nitpicks — they compound into codebases that are harder to debug, review, and maintain.

This plugin catches those patterns at lint time and provides error messages designed for LLM comprehension: **what's wrong**, **why it matters**, and **a concrete fix**. The result is AI-generated code that reads like it was written by a senior engineer.

## Why this plugin?

- **Targeted rules** — Every rule addresses a real pattern LLMs consistently get wrong, from `export const fn = () => {}` to `logger.error(\`Failed for ${userId}\`)`
- **Teaching error messages** — Structured feedback that LLMs can parse and learn from across iterations
- **Works for humans too** — These are solid code quality rules regardless of who wrote the code
- **Zero config** — The `recommended` preset is ready out of the box
- **Suggestions, not auto-fixes** — Transformations that could change semantics are offered as suggestions, keeping you in control

## How It Works

This plugin is designed around three principles that make it effective for LLM-assisted development:

### Deterministic Feedback

Every rule produces the **exact same error message for the same mistake**, every time. There is no randomness, no varying phrasing, no context-dependent rewording. This consistency means LLMs build reliable pattern associations between violations and fixes across iterations.

### Instructional Error Messages

Every error message follows a structured teaching format:

1. **What's wrong** — the specific violation
2. **Why it matters** — the rationale behind the rule
3. **How to fix** — a concrete, copy-pasteable transformation using the actual code context (function names, parameter lists, etc.)

```
Exported function 'fetchData' must use a function declaration, not a function expression or arrow function.

Why: Function declarations are hoisted, produce better stack traces, and signal clear intent.
LLMs default to arrow functions — this rule enforces the preferred pattern.

How to fix:
  Replace: export const fetchData = async () => { ... }
  With:    export async function fetchData() { ... }
```

This structure is parseable by LLMs — they extract the fix and apply it. After 2-3 iterations, the LLM learns the pattern and stops making the same mistake.

### Strict Mode by Default

Both the `recommended` and `all` configs set every rule to `error`, not `warn`. Warnings are easy to ignore — for both humans and LLMs. Errors force the issue to be resolved before the code is accepted. Combined with the `no-inline-disable` rule (which prevents `// eslint-disable` escape hatches), this creates a feedback loop where the LLM **must** fix violations rather than suppress them.

## Installation

```bash
npm install eslint-plugin-llm-core --save-dev
```

## Quick Start

```js
// eslint.config.mjs
import llmCore from "eslint-plugin-llm-core";

export default [...llmCore.configs.recommended];
```

That's it. All recommended rules are now active.

### Available Configs

| Config        | Description                                     |
| ------------- | ----------------------------------------------- |
| `recommended` | Safe defaults — rules most codebases should use |
| `all`         | Every rule at `error` — for strict codebases    |

### Manual Rule Configuration

```js
// eslint.config.mjs
import llmCore from "eslint-plugin-llm-core";

export default [
  {
    plugins: {
      "llm-core": llmCore,
    },
    rules: {
      "llm-core/no-exported-function-expressions": "error",
      "llm-core/structured-logging": "error",
    },
  },
];
```

## Rules

<!-- begin auto-generated rules list -->

💼 Configurations enabled in.\
🌐 Set in the `all` configuration.\
✅ Set in the `recommended` configuration.\
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

| Name                                                                               | Description                                                                                                  | 💼    | 💡  |
| :--------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- | :---- | :-- |
| [filename-match-export](docs/rules/filename-match-export.md)                       | Enforce that filenames match their single exported function, class, or component name                        | 🌐 ✅ |     |
| [max-file-length](docs/rules/max-file-length.md)                                   | Enforce a maximum number of lines per file to encourage proper module separation                             | 🌐 ✅ |     |
| [max-function-length](docs/rules/max-function-length.md)                           | Enforce a maximum number of lines per function to encourage decomposition                                    | 🌐 ✅ |     |
| [max-nesting-depth](docs/rules/max-nesting-depth.md)                               | Enforce a maximum nesting depth for control flow statements to reduce cognitive complexity                   | 🌐 ✅ |     |
| [max-params](docs/rules/max-params.md)                                             | Enforce a maximum number of function parameters to encourage object parameter patterns                       | 🌐 ✅ |     |
| [naming-conventions](docs/rules/naming-conventions.md)                             | Enforce naming conventions: Base prefix for abstract classes, Error suffix for error classes                 | 🌐 ✅ |     |
| [no-commented-out-code](docs/rules/no-commented-out-code.md)                       | Disallow commented-out code to keep the codebase clean and reduce noise                                      | 🌐 ✅ |     |
| [no-exported-function-expressions](docs/rules/no-exported-function-expressions.md) | Enforce that exported functions use function declarations instead of function expressions or arrow functions | 🌐 ✅ | 💡  |
| [no-inline-disable](docs/rules/no-inline-disable.md)                               | Disallow eslint-disable comments that suppress lint errors instead of fixing them                            | 🌐 ✅ |     |
| [no-magic-numbers](docs/rules/no-magic-numbers.md)                                 | Disallow magic numbers and enforce named constants for clarity                                               | 🌐 ✅ |     |
| [prefer-early-return](docs/rules/prefer-early-return.md)                           | Enforce guard clauses (early returns) instead of wrapping function bodies in a single if statement           | 🌐 ✅ |     |
| [structured-logging](docs/rules/structured-logging.md)                             | Enforce structured logging with static messages and dynamic values as separate metadata                      | 🌐 ✅ |     |

<!-- end auto-generated rules list -->

## Contributing

```bash
npm install
npm run build
npm run test
npm run lint
```

See [CLAUDE.md](CLAUDE.md) for architecture details and how to add new rules.

## License

MIT
