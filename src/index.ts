import type { TSESLint } from "@typescript-eslint/utils";
import * as rules from "./rules";

type RuleKey = keyof typeof rules;

const plugin = {
  meta: {
    name: "eslint-plugin-llm-core",
    version: "0.1.0",
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
      plugins: { "llm-core": plugin },
      rules: recommendedRules,
    },
  ],
  all: [
    {
      plugins: { "llm-core": plugin },
      rules: allRules,
    },
  ],
};

export = plugin;
