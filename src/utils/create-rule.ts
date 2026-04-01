import { ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/rsimpson2/eslint-plugin-llm-core/blob/main/docs/rules/${name}.md`,
);
