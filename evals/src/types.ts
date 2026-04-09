export type EvalMode = "treatment" | "control";

export interface LintViolation {
  ruleId: string;
  message: string;
  line: number;
  column: number;
}

export interface IterationRecord {
  iteration: number;
  violationsBefore: number;
  violationsAfter: number;
  rejectedCandidate?: string;
  remainingRuleIds?: string[];
}

export interface FixtureResult {
  fixture: string;
  mode: EvalMode;
  iterations: number;
  resolved: boolean;
  iterationRecords: IterationRecord[];
  finalViolationCount: number;
}

export interface EvalConfig {
  mode: EvalMode | "both";
  model: string;
  fixtureFilter: string[];
  maxIterations: number;
  outputDir: string;
}

export interface EvalResults {
  date: string;
  model: string;
  pluginVersion: string;
  gitCommit: string;
  results: FixtureResult[];
}
