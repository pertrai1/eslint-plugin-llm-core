import type { TSESLint } from "@typescript-eslint/utils";
import * as rules from "./rules";
import { version } from "../package.json";

type RuleKey = keyof typeof rules;

const plugin = {
  meta: {
    name: "eslint-plugin-llm-core",
    version,
  },
  rules,
  configs: {} as Record<string, TSESLint.FlatConfig.ConfigArray>,
};

const recommendedRules: TSESLint.FlatConfig.Rules = {
  "llm-core/no-exported-function-expressions": "error",
  "llm-core/filename-match-export": "error",
  "llm-core/structured-logging": "error",
  "llm-core/max-nesting-depth": "error",
  "llm-core/no-inline-disable": "error",
  "llm-core/max-params": "error",
  "llm-core/max-function-length": "error",
  "llm-core/max-file-length": "error",
  "llm-core/no-magic-numbers": "error",
  "llm-core/naming-conventions": "error",
  "llm-core/no-commented-out-code": "error",
  "llm-core/prefer-early-return": "error",
  "llm-core/no-async-array-callbacks": "error",
  "llm-core/no-type-assertion-any": "error",
  "llm-core/no-any-in-generic": "error",
  "llm-core/throw-error-objects": "error",
  "llm-core/no-empty-catch": "error",
  "llm-core/prefer-unknown-in-catch": "error",
};

const allRules: TSESLint.FlatConfig.Rules = Object.fromEntries(
  Object.keys(rules).map((rule) => [
    `llm-core/${rule as RuleKey}`,
    "error" as const,
  ]),
);

plugin.configs = {
  recommended: [
    {
      files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs", "**/*.cjs"],
      plugins: { "llm-core": plugin },
      rules: recommendedRules,
    },
  ],
  all: [
    {
      files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs", "**/*.cjs"],
      plugins: { "llm-core": plugin },
      rules: allRules,
    },
  ],
};

export = plugin;
