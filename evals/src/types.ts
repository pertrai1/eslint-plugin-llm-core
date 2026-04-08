export type EvalMode = "treatment" | "control";

export interface LintViolation {
  ruleId: string;
  message: string;
  line: number;
  column: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ViolationDiff {
  resolved: LintViolation[];
  persisted: LintViolation[];
  introduced: LintViolation[];
}

export interface FailurePatterns {
  stuckRules: string[];
  oscillatingRules: string[];
  cascadingErrors: boolean;
}

export interface LlmFixResult {
  code: string;
  rawResponse: string;
  reasoning: string | null;
  tokenUsage: TokenUsage;
  prompt: string;
}

export interface IterationRecord {
  iteration: number;
  violationsBefore: number;
  violationsAfter: number;
  rejectedCandidate?: string;
  remainingRuleIds?: string[];
  promptSent?: string;
  llmResponse?: string;
  codeDiff?: string;
  tokenUsage?: TokenUsage;
  reasoning?: string | null;
  violationDiff?: ViolationDiff;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export interface FixtureResult {
  fixture: string;
  mode: EvalMode;
  iterations: number;
  resolved: boolean;
  iterationRecords: IterationRecord[];
  finalViolationCount: number;
  patterns?: FailurePatterns;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export interface EvalConfig {
  mode: EvalMode | "both";
  model: string;
  fixtureFilter: string[];
  maxIterations: number;
  outputDir: string;
  compact: boolean;
  replayFile: string | null;
  replayIteration: number | null;
}

export interface EvalResults {
  date: string;
  model: string;
  pluginVersion: string;
  results: FixtureResult[];
}
