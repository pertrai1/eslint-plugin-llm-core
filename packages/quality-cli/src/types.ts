export type QualityCommand = "scan" | "ci";

export type QualityReporter = "text" | "json" | "sarif";

export type QualityColorMode = "auto" | "always" | "never";

export type QualityEngine = "eslint" | "knip";

export type QualitySeverity = "error" | "warning" | "notice";

export type QualityFinding = {
  engine: QualityEngine;
  severity: QualitySeverity;
  message: string;
  filePath?: string;
  ruleId?: string;
  line?: number;
  column?: number;
};

export type QualityToolInvocation = {
  engine: QualityEngine;
  command: string;
  args: string[];
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type QualityScanOptions = {
  command: QualityCommand;
  reporter: QualityReporter;
  cwd: string;
  targets: string[];
  engines: QualityEngine[];
  failOnFindings: boolean;
  compact: boolean;
  color: QualityColorMode;
};

export type QualityScanResult = {
  ok: boolean;
  exitCode: number;
  findings: QualityFinding[];
  invocations: QualityToolInvocation[];
};

export type CommandExecutor = (
  engine: QualityEngine,
  command: string,
  args: string[],
  cwd: string,
) => Promise<QualityToolInvocation>;
