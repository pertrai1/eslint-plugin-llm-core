import path from "path";
import { loadESLint } from "eslint";
import { ruleDefaultOptions, ruleInstructions } from "./rule-instructions";
import type { ResolvedRule, RuleInstruction } from "./types";

type ResolvedLintRule = {
  enabled: boolean;
  options: Record<string, unknown>;
};

type FlatESLint = new (options?: { overrideConfigFile?: string }) => {
  calculateConfigForFile(
    filePath: string,
  ): Promise<{ rules?: Record<string, unknown> }>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatOptionValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}

function getReferencedOptionKeys(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
}

function interpolateTemplate(
  template: string,
  options: Record<string, unknown>,
): string {
  return template.replaceAll(/\{(\w+)\}/g, (match, key: string) => {
    if (!(key in options) || options[key] === undefined) {
      return match;
    }

    return formatOptionValue(options[key]);
  });
}

function isEnabledSeverity(value: unknown): boolean {
  return value === "warn" || value === "error" || value === 1 || value === 2;
}

function resolveLintRuleConfig(
  ruleName: string,
  ruleConfig: unknown,
): ResolvedLintRule {
  const defaultOptions = ruleDefaultOptions[ruleName] ?? {};

  if (Array.isArray(ruleConfig)) {
    const [severity, configuredOptions] = ruleConfig;

    return {
      enabled: isEnabledSeverity(severity),
      options: isPlainObject(configuredOptions)
        ? { ...defaultOptions, ...configuredOptions }
        : { ...defaultOptions },
    };
  }

  return {
    enabled: isEnabledSeverity(ruleConfig),
    options: { ...defaultOptions },
  };
}

export function interpolateInstruction(
  instruction: RuleInstruction,
  options: Record<string, unknown>,
): string {
  const principleKeys = getReferencedOptionKeys(instruction.principle);
  const templateKeys = instruction.optionTemplate
    ? getReferencedOptionKeys(instruction.optionTemplate)
    : principleKeys;
  const referencedOptionCount = templateKeys.filter(
    (key) => options[key] !== undefined,
  ).length;

  if (principleKeys.length === 0 && !instruction.optionTemplate) {
    return instruction.principle;
  }

  if (referencedOptionCount === 0) {
    return instruction.principle;
  }

  if (principleKeys.length > 1 && !instruction.optionTemplate) {
    return instruction.principle;
  }

  const template = instruction.optionTemplate ?? instruction.principle;

  return interpolateTemplate(template, options);
}

export async function resolveActiveRules(
  configPath?: string,
): Promise<ResolvedRule[]> {
  // ESLint types do not expose the flat-config overload; cast is safe at runtime
  const loadFlatESLint = loadESLint as unknown as (options: {
    useFlatConfig: boolean;
  }) => Promise<FlatESLint>;
  const ESLint = await loadFlatESLint({ useFlatConfig: true });
  const eslint = configPath
    ? new ESLint({ overrideConfigFile: configPath })
    : new ESLint({});
  const cwd = process.cwd();

  const jsConfig = await eslint.calculateConfigForFile(
    path.join(cwd, "__virtual__.js"),
  );
  const tsConfig = await eslint.calculateConfigForFile(
    path.join(cwd, "__virtual__.ts"),
  );

  const jsRules = (jsConfig.rules ?? {}) as Record<string, unknown>;
  const tsRules = (tsConfig.rules ?? {}) as Record<string, unknown>;

  const ruleNames = new Set(
    [...Object.keys(jsRules), ...Object.keys(tsRules)]
      .filter((ruleName) => ruleName.startsWith("llm-core/"))
      .map((ruleName) => ruleName.replace(/^llm-core\//, "")),
  );

  return [...ruleNames]
    .filter((ruleName) => ruleName in ruleInstructions)
    .map((ruleName) => {
      const jsRule = resolveLintRuleConfig(
        ruleName,
        jsRules[`llm-core/${ruleName}`],
      );
      const tsRule = resolveLintRuleConfig(
        ruleName,
        tsRules[`llm-core/${ruleName}`],
      );
      const enabledInJs = jsRule.enabled;
      const enabledInTs = tsRule.enabled;

      if (!enabledInJs && !enabledInTs) {
        return null;
      }

      const scope = enabledInTs && !enabledInJs ? "typescript-only" : "all";
      const options = enabledInJs ? jsRule.options : tsRule.options;

      return {
        name: ruleName,
        instruction: interpolateInstruction(
          ruleInstructions[ruleName],
          options,
        ),
        scope,
      } satisfies ResolvedRule;
    })
    .filter((rule): rule is ResolvedRule => rule !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}
