import path from "path";
import { loadESLint } from "eslint";
import { ruleDefaultOptions, ruleInstructions } from "./rule-instructions";
import type { ResolvedRule, RuleInstruction } from "./types";

type ResolvedLintRule = {
  enabled: boolean;
  options: Record<string, unknown>;
};

type SampleScope = "javascript" | "typescript";

type VirtualFileSample = {
  fileName: string;
  scope: SampleScope;
};

const VIRTUAL_FILE_SAMPLES: VirtualFileSample[] = [
  { fileName: "__virtual__.js", scope: "javascript" },
  { fileName: "__virtual__.jsx", scope: "javascript" },
  { fileName: "__virtual__.mjs", scope: "javascript" },
  { fileName: "__virtual__.cjs", scope: "javascript" },
  { fileName: "__virtual__.ts", scope: "typescript" },
  { fileName: "__virtual__.tsx", scope: "typescript" },
];

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
  return [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!);
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

function normalizeOptionValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeOptionValue);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalizeOptionValue(value[key])]),
    );
  }

  return value;
}

function areOptionsEqual(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): boolean {
  return (
    JSON.stringify(normalizeOptionValue(left)) ===
    JSON.stringify(normalizeOptionValue(right))
  );
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

function resolveFirstEnabledRuleConfig(
  ruleName: string,
  ruleConfigs: unknown[],
): ResolvedLintRule {
  // Known limitation: when extensions within the same scope configure different
  // options, the first enabled extension wins. The public model currently groups
  // only by JavaScript vs TypeScript scope, not by individual extension.
  for (const ruleConfig of ruleConfigs) {
    const resolvedRule = resolveLintRuleConfig(ruleName, ruleConfig);

    if (resolvedRule.enabled) {
      return resolvedRule;
    }
  }

  return resolveLintRuleConfig(ruleName, undefined);
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

  const sampledConfigs = await Promise.all(
    VIRTUAL_FILE_SAMPLES.map(async (sample) => {
      const config = await eslint.calculateConfigForFile(
        path.join(cwd, sample.fileName),
      );

      return {
        scope: sample.scope,
        rules: (config?.rules ?? {}) as Record<string, unknown>,
      };
    }),
  );
  const jsRuleConfigs = sampledConfigs
    .filter((config) => config.scope === "javascript")
    .map((config) => config.rules);
  const tsRuleConfigs = sampledConfigs
    .filter((config) => config.scope === "typescript")
    .map((config) => config.rules);

  const ruleNames = new Set(
    sampledConfigs
      .flatMap((config) => Object.keys(config.rules))
      .filter((ruleName) => ruleName.startsWith("llm-core/"))
      .map((ruleName) => ruleName.replace(/^llm-core\//, "")),
  );

  return [...ruleNames]
    .filter((ruleName) => ruleName in ruleInstructions)
    .flatMap((ruleName): ResolvedRule[] => {
      const jsRule = resolveFirstEnabledRuleConfig(
        ruleName,
        jsRuleConfigs.map((rules) => rules[`llm-core/${ruleName}`]),
      );
      const tsRule = resolveFirstEnabledRuleConfig(
        ruleName,
        tsRuleConfigs.map((rules) => rules[`llm-core/${ruleName}`]),
      );
      const enabledInJs = jsRule.enabled;
      const enabledInTs = tsRule.enabled;

      if (!enabledInJs && !enabledInTs) {
        return [];
      }

      // Guard required for `noUncheckedIndexedAccess` — the prior
      // `.filter(ruleName => ruleName in ruleInstructions)` guarantees
      // the key exists at runtime.
      const instruction = ruleInstructions[ruleName];
      if (!instruction) {
        return [];
      }

      if (
        enabledInJs &&
        enabledInTs &&
        !areOptionsEqual(jsRule.options, tsRule.options)
      ) {
        return [
          {
            name: ruleName,
            instruction: interpolateInstruction(instruction, jsRule.options),
            scope: "javascript-only",
          },
          {
            name: ruleName,
            instruction: interpolateInstruction(instruction, tsRule.options),
            scope: "typescript-only",
          },
        ];
      }

      const scope = enabledInTs && !enabledInJs ? "typescript-only" : "all";
      const options = enabledInJs ? jsRule.options : tsRule.options;

      return [
        {
          name: ruleName,
          instruction: interpolateInstruction(instruction, options),
          scope,
        },
      ];
    })
    .sort((left, right) => {
      const nameComparison = left.name.localeCompare(right.name);

      if (nameComparison !== 0) {
        return nameComparison;
      }

      return left.scope.localeCompare(right.scope);
    });
}
