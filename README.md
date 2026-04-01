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
| [no-exported-function-expressions](docs/rules/no-exported-function-expressions.md) | Enforce that exported functions use function declarations instead of function expressions or arrow functions | 🌐 ✅ | 💡  |
| [no-inline-disable](docs/rules/no-inline-disable.md)                               | Disallow eslint-disable comments that suppress lint errors instead of fixing them                            | 🌐 ✅ |     |
| [no-magic-numbers](docs/rules/no-magic-numbers.md)                                 | Disallow magic numbers and enforce named constants for clarity                                               | 🌐 ✅ |     |
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

ISC
