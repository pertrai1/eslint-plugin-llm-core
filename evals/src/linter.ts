import { Linter } from "eslint";
import * as tsParser from "@typescript-eslint/parser";
import type { LintViolation } from "./types";
import * as pluginRules from "../../src/rules/index";

const rulesMap = pluginRules as unknown as Record<string, unknown>;

const rulesEnabled: Record<string, "error"> = Object.fromEntries(
  Object.keys(rulesMap).map((name) => [`llm-core/${name}`, "error"]),
);

const linterInstance = new Linter();

const flatConfig = {
  plugins: { "llm-core": { rules: rulesMap } },
  rules: rulesEnabled,
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  },
};

export function lintCode(code: string): LintViolation[] {
  const messages = linterInstance.verify(
    code,
    flatConfig as unknown as Parameters<typeof linterInstance.verify>[1],
    { filename: "file.ts" },
  );

  return messages
    .filter((msg) => msg.ruleId !== null)
    .map((msg) => ({
      ruleId: msg.ruleId,
      message: msg.message,
      line: msg.line,
      column: msg.column,
    }));
}
