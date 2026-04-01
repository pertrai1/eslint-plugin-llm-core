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
  {
    plugins: {
      "llm-core": llmCore,
    },
    rules: {
      // Enable rules here
    },
  },
];
```

## Rules

<!-- begin auto-generated rules list -->

💡 Manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

| Name                                                                               | Description                                                                                                  | 💡  |
| :--------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- | :-- |
| [no-exported-function-expressions](docs/rules/no-exported-function-expressions.md) | Enforce that exported functions use function declarations instead of function expressions or arrow functions | 💡  |

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
