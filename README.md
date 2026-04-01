# eslint-plugin-llm-core

ESLint plugin to help LLM agents self-correct and learn from mistakes.

## Installation

```bash
npm install eslint-plugin-llm-core --save-dev
```

## Usage

In your `eslint.config.mjs`:

```js
import llmCore from "eslint-plugin-llm-core";

export default [
  // Use the recommended config
  ...llmCore.configs.recommended,
];
```

### Available Configs

| Config        | Description                                          |
| ------------- | ---------------------------------------------------- |
| `recommended` | Safe defaults — rules most codebases should use      |
| `all`         | Every rule enabled at `error` — for strict codebases |

### Manual Rule Configuration

```js
import llmCore from "eslint-plugin-llm-core";

export default [
  {
    plugins: {
      "llm-core": llmCore,
    },
    rules: {
      "llm-core/no-exported-function-expressions": "error",
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
| [no-exported-function-expressions](docs/rules/no-exported-function-expressions.md) | Enforce that exported functions use function declarations instead of function expressions or arrow functions | 🌐 ✅ | 💡  |
| [structured-logging](docs/rules/structured-logging.md)                             | Enforce structured logging with static messages and dynamic values as separate metadata                      | 🌐 ✅ |     |

<!-- end auto-generated rules list -->

## Development

```bash
npm install
npm run build
npm run test
npm run lint
```

## License

ISC
