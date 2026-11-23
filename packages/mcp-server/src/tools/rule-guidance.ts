import plugin from "eslint-plugin-llm-core";
import { getRuleInstruction } from "eslint-plugin-llm-core/instructions";

export const LLM_CORE_PREFIX = "llm-core/";

interface RuleModuleWithDefaults {
  defaultOptions?: readonly unknown[];
}

const coreRules = (
  plugin as unknown as { rules: Record<string, RuleModuleWithDefaults> }
).rules;

export function isEnabledRuleConfig(configEntry: unknown): boolean {
  const severity = Array.isArray(configEntry) ? configEntry[0] : configEntry;
  return (
    severity === "warn" ||
    severity === "error" ||
    severity === 1 ||
    severity === 2
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Interpolate a rule instruction from its defaults and effective file options. */
export function getConfiguredRuleInstruction(
  ruleId: string,
  configEntry: unknown,
): string | undefined {
  const bareName = ruleId.slice(LLM_CORE_PREFIX.length);
  const defaults = coreRules[bareName]?.defaultOptions?.[0];
  const configured = Array.isArray(configEntry) ? configEntry[1] : undefined;
  return getRuleInstruction(ruleId, {
    ...(isPlainObject(defaults) ? defaults : {}),
    ...(isPlainObject(configured) ? configured : {}),
  });
}
