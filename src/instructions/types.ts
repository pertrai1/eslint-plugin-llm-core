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
