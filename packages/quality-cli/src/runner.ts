import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  CommandExecutor,
  QualityEngine,
  QualityFinding,
  QualityScanOptions,
  QualityScanResult,
  QualitySeverity,
  QualityToolInvocation,
} from "./types.js";

export const DEFAULT_ENGINES: QualityEngine[] = ["eslint", "knip"];

export function buildEngineArgs(
  engine: QualityEngine,
  targets: string[],
): string[] {
  if (engine === "eslint") {
    const eslintTargets = targets.length > 0 ? targets : ["."];
    return [...eslintTargets, "--format", "json"];
  }

  return ["--reporter", "json", "--no-exit-code"];
}

export function buildEngineCommand(engine: QualityEngine): string {
  return engine;
}

export const spawnExecutor: CommandExecutor = async (
  engine,
  command,
  args,
  cwd,
) => {
  return await new Promise<QualityToolInvocation>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        PATH: buildExecutionPath(cwd),
      },
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      reject(error);
    });
    child.on("close", (exitCode) => {
      resolve({
        engine,
        command,
        args,
        exitCode: exitCode ?? 1,
        stdout,
        stderr,
      });
    });
  });
};

export async function runQualityScan(
  options: QualityScanOptions,
  executor: CommandExecutor = spawnExecutor,
): Promise<QualityScanResult> {
  const invocations: QualityToolInvocation[] = [];
  const findings: QualityFinding[] = [];

  for (const engine of options.engines) {
    const invocation = await executor(
      engine,
      buildEngineCommand(engine),
      buildEngineArgs(engine, options.targets),
      options.cwd,
    );
    invocations.push(invocation);
    findings.push(...extractFindings(invocation));
  }

  const hasToolFailure = invocations.some(
    (invocation) => invocation.exitCode > 1,
  );
  const hasFindings = findings.length > 0;
  const exitCode =
    hasToolFailure || (options.failOnFindings && hasFindings) ? 1 : 0;

  return {
    ok: exitCode === 0,
    exitCode,
    findings,
    invocations,
  };
}

function buildExecutionPath(cwd: string): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const pathEntries = [
    path.join(cwd, "node_modules", ".bin"),
    path.join(cwd, "..", "..", "node_modules", ".bin"),
    path.resolve(moduleDir, "..", "node_modules", ".bin"),
    path.resolve(moduleDir, "..", "..", ".bin"),
    path.resolve(moduleDir, "..", "..", "..", "node_modules", ".bin"),
    process.env.PATH ?? "",
  ];

  return pathEntries.filter(Boolean).join(path.delimiter);
}

function extractFindings(invocation: QualityToolInvocation): QualityFinding[] {
  if (invocation.engine === "eslint") {
    return extractEslintFindings(invocation.stdout);
  }

  return extractKnipFindings(invocation.stdout);
}

type EslintMessage = {
  ruleId?: string | null;
  severity?: number;
  message?: string;
  line?: number;
  column?: number;
};

type EslintFileResult = {
  filePath?: string;
  messages?: EslintMessage[];
};

function extractEslintFindings(stdout: string): QualityFinding[] {
  const parsed = parseJson<EslintFileResult[]>(stdout, []);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.flatMap((fileResult) =>
    (fileResult.messages ?? []).map((message) => ({
      engine: "eslint" as const,
      severity: toSeverity(message.severity),
      message: message.message ?? "ESLint reported an issue",
      filePath: fileResult.filePath,
      ruleId: message.ruleId ?? undefined,
      line: message.line,
      column: message.column,
    })),
  );
}

type KnipIssue = {
  type?: string;
  file?: string;
  filePath?: string;
  symbol?: string;
  name?: string;
  message?: string;
};

type KnipReport = {
  issues?: KnipIssue[];
};

function extractKnipFindings(stdout: string): QualityFinding[] {
  const parsed = parseJson<KnipReport>(stdout, {});
  const issues = Array.isArray(parsed.issues) ? parsed.issues : [];

  return issues.map((issue) => ({
    engine: "knip" as const,
    severity: "warning" as const,
    message: issue.message ?? describeKnipIssue(issue),
    filePath: issue.filePath ?? issue.file,
    ruleId: issue.type,
  }));
}

function describeKnipIssue(issue: KnipIssue): string {
  const label = issue.symbol ?? issue.name ?? issue.file ?? "project issue";
  return issue.type ? `${issue.type}: ${label}` : `Knip reported ${label}`;
}

function toSeverity(severity: number | undefined): QualitySeverity {
  if (severity === 2) {
    return "error";
  }

  if (severity === 1) {
    return "warning";
  }

  return "notice";
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
