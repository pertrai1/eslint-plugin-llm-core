// Fixture ESLint flat config for lint_file integration tests.
// Enables eslint-plugin-llm-core with @typescript-eslint/parser for .ts files.
import llmCore from "eslint-plugin-llm-core";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      "llm-core": llmCore,
    },
    rules: {
      "llm-core/no-empty-catch": "error",
    },
  },
];
