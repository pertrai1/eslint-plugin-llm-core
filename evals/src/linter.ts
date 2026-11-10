import { Linter } from "eslint";
import * as tsParser from "@typescript-eslint/parser";
import type { LintViolation } from "./types";
import * as pluginRules from "../../packages/eslint-plugin/src/rules/index";

const rulesMap = pluginRules as unknown as Record<string, unknown>;

export function normalizeRuleFilter(
  ruleFilter: readonly string[] = [],
): string[] {
  for (const name of ruleFilter) {
    if (!Object.hasOwn(rulesEnabled, `llm-core/${name}`)) {
      throw new Error(
        `Invalid rule "${name}". Use exact short names: ${Object.keys(rulesMap).sort().join(", ")}`,
      );
    }
  }
  return [...new Set(ruleFilter)].sort();
}

const rulesEnabled: Record<string, "error"> = Object.fromEntries(
  Object.keys(rulesMap).map((name) => [`llm-core/${name}`, "error"]),
);

const linterInstance = new Linter({ configType: "flat" });

const flatConfig = [
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

export function lintCode(
  code: string,
  ruleFilter: readonly string[] = [],
): LintViolation[] {
  const selected = normalizeRuleFilter(ruleFilter);
  const config =
    selected.length === 0
      ? flatConfig
      : flatConfig.map((entry) => ({
          ...entry,
          rules: Object.fromEntries(
            selected.map((name) => {
              const id = `llm-core/${name}`;
              return [id, rulesEnabled[id]!];
            }),
          ),
        }));
  const messages = linterInstance.verify(
    code,
    config as unknown as Parameters<typeof linterInstance.verify>[1],
    { filename: "file.ts" },
  );

  return messages
    .filter((msg) => msg.ruleId !== null)
    .map((msg) => ({
      ruleId: msg.ruleId!,
      message: msg.message,
      line: msg.line,
      column: msg.column,
    }));
}
