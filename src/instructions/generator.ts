import type { ResolvedRule } from "./types";

function renderRuleList(rules: ResolvedRule[]): string {
  return rules.map((rule) => `- ${rule.instruction}`).join("\n");
}

export function generateMarkdown(rules: ResolvedRule[]): string {
  const allFilesRules = rules.filter((rule) => rule.scope === "all");
  const typescriptRules = rules.filter(
    (rule) => rule.scope === "typescript-only",
  );

  let content = `# Coding Guidelines

Generated from eslint-plugin-llm-core configuration.
Regenerate with: npx eslint-plugin-llm-core generate-instructions
`;

  if (allFilesRules.length > 0) {
    content += `
## All Files

${renderRuleList(allFilesRules)}
`;
  }

  if (typescriptRules.length > 0) {
    content += `
## TypeScript Files Only

${renderRuleList(typescriptRules)}
`;
  }

  return content;
}
