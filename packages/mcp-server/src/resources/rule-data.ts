import plugin from "eslint-plugin-llm-core";
import { getRuleInstruction } from "eslint-plugin-llm-core/instructions";

type RuleCategory =
  "complexity" | "typescript" | "best-practices" | "style" | "hygiene";

interface RuleListEntry {
  name: string;
  description: string;
  hasInstruction: boolean;
  category: RuleCategory;
}

interface RuleModule {
  meta?: {
    docs?: {
      description?: string;
    };
  };
}

interface FlatConfigLike {
  rules?: Record<string, unknown>;
}

interface PluginLike {
  rules: Record<string, RuleModule>;
  configs: Record<string, FlatConfigLike[]>;
}

const llmCorePlugin = plugin as unknown as PluginLike;

const CATEGORY_CONFIGS: RuleCategory[] = [
  "complexity",
  "typescript",
  "best-practices",
  "style",
  "hygiene",
];

// These rules are currently published only through the broad `all` config. The
// MCP resource still needs one of the public category labels for every rule.
const ALL_ONLY_RULE_CATEGORIES: Record<string, RuleCategory> = {
  "no-hallucinated-local-imports": "hygiene",
  "no-hallucinated-package-imports": "hygiene",
  "no-incorrect-sort": "best-practices",
};

function bareRuleId(ruleId: string): string {
  return ruleId.replace(/^llm-core\//, "");
}

function rulesInConfig(configName: RuleCategory): Set<string> {
  return new Set(
    (llmCorePlugin.configs[configName] ?? [])
      .flatMap((config) => Object.keys(config.rules ?? {}))
      .map(bareRuleId),
  );
}

const ruleCategories = new Map<string, RuleCategory>([
  ...CATEGORY_CONFIGS.flatMap((category) =>
    [...rulesInConfig(category)].map((ruleName) => [ruleName, category]),
  ),
  ...Object.entries(ALL_ONLY_RULE_CATEGORIES),
] as Array<[string, RuleCategory]>);

export function getRuleNames(): string[] {
  return Object.keys(llmCorePlugin.rules).sort((left, right) =>
    left.localeCompare(right),
  );
}

export function getRuleListEntries(): RuleListEntry[] {
  return getRuleNames().map((name) => {
    const category = ruleCategories.get(name);
    if (!category) {
      throw new Error(`Rule "${name}" is not assigned to a public category.`);
    }

    return {
      name,
      description: llmCorePlugin.rules[name]?.meta?.docs?.description ?? "",
      hasInstruction: getRuleInstruction(name) !== undefined,
      category,
    };
  });
}

export function getCategoryCounts(
  entries: RuleListEntry[],
): Record<RuleCategory, number> {
  return {
    complexity: entries.filter((entry) => entry.category === "complexity")
      .length,
    typescript: entries.filter((entry) => entry.category === "typescript")
      .length,
    "best-practices": entries.filter(
      (entry) => entry.category === "best-practices",
    ).length,
    style: entries.filter((entry) => entry.category === "style").length,
    hygiene: entries.filter((entry) => entry.category === "hygiene").length,
  };
}
