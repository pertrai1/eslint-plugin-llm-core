import type { ResolvedRule } from "./types";

function renderRuleList(rules: ResolvedRule[]): string {
  return rules.map((rule) => `- ${rule.instruction}`).join("\n");
}

export function generateMarkdown(rules: ResolvedRule[]): string {
  const allFilesRules = rules.filter((rule) => rule.scope === "all");
  const javascriptRules = rules.filter(
    (rule) => rule.scope === "javascript-only",
  );
  const typescriptRules = rules.filter(
    (rule) => rule.scope === "typescript-only",
  );

  let content = `# Coding Guidelines

Generated from eslint-plugin-llm-core configuration.
Regenerate with: npx llm-core-instructions
`;

  if (allFilesRules.length > 0) {
    content += `
## All Files

${renderRuleList(allFilesRules)}
`;
  }

  if (javascriptRules.length > 0) {
    content += `
## JavaScript Files Only

${renderRuleList(javascriptRules)}
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
