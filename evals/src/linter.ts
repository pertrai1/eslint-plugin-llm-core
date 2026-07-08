import { Linter } from "eslint";
import * as tsParser from "@typescript-eslint/parser";
import type { LintViolation } from "./types";
import * as pluginRules from "../../src/rules/index";

const rulesMap: Record<string, unknown> = Object.fromEntries(
  Object.entries(pluginRules),
);

const rulesEnabled: Record<string, "error"> = Object.fromEntries(
  Object.keys(rulesMap).map((name) => [`llm-core/${name}`, "error"]),
);

const linterInstance = new Linter({ configType: "flat" });

const flatConfig: Parameters<typeof linterInstance.verify>[1] = [
  {
    files: ["**/*.ts"],
    plugins: { "llm-core": { rules: rulesMap } },
    rules: rulesEnabled,
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: "module" },
    },
  },
];

export function lintCode(code: string): LintViolation[] {
  const messages = linterInstance.verify(code, flatConfig, {
    filename: "file.ts",
  });

  return messages
    .filter((msg) => msg.ruleId !== null)
    .map((msg) => ({
      ruleId: msg.ruleId!,
      message: msg.message,
      line: msg.line,
      column: msg.column,
    }));
}
