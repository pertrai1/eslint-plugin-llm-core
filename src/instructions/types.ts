/**
 * Behavioral guideline for a lint rule, included in generated instruction files.
 *
 * Every `{key}` placeholder in `principle` or `optionTemplate` MUST have a
 * corresponding entry in the rule's `defaultOptions` (or the key will be emitted
 * verbatim when no option is configured).
 */
export interface RuleInstruction {
  principle: string;
  optionTemplate?: string;
}

export interface ResolvedRule {
  name: string;
  instruction: string;
  scope: "all" | "typescript-only";
}

export interface GenerateInstructionsResult {
  content: string;
  activeRules: ResolvedRule[];
  allFilesRules: ResolvedRule[];
  typescriptRules: ResolvedRule[];
}

export interface GenerateInstructionsOptions {
  configPath?: string;
}
