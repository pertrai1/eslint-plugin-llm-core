// Fixture ESLint flat config for lint_file integration tests.
// Path-scoped so each test targets an isolated rule configuration.
import llmCore from "eslint-plugin-llm-core";
import tsParser from "@typescript-eslint/parser";

export default [
  // Parser for every TypeScript file in the fixture project.
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
    },
  },
  // src/: no-empty-catch (llm-core) + no-debugger (core, used to verify the
  // tool excludes non-llm-core diagnostics).
  {
    files: ["src/**/*.ts"],
    plugins: {
      "llm-core": llmCore,
    },
    rules: {
      "llm-core/no-empty-catch": "error",
      "no-debugger": "error",
    },
  },
  // configurable/default/: max-params with DEFAULT options (no override) — the
  // instruction must interpolate the rule's defaults ({ max: 2, maxConstructor: 5 }).
  {
    files: ["configurable/default/**/*.ts"],
    plugins: {
      "llm-core": llmCore,
    },
    rules: {
      "llm-core/max-params": "error",
    },
  },
  // configurable/explicit/: max-params with EXPLICIT options — the instruction
  // must interpolate the configured values.
  {
    files: ["configurable/explicit/**/*.ts"],
    plugins: {
      "llm-core": llmCore,
    },
    rules: {
      "llm-core/max-params": ["error", { max: 1, maxConstructor: 1 }],
    },
  },
];
