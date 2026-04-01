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

No rules have been added yet.

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
