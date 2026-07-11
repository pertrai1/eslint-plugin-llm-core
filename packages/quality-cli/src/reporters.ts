import path from "node:path";

import { createColors } from "picocolors";

import type {
  QualityEngine,
  QualityFinding,
  QualityScanResult,
  QualitySeverity,
} from "./types.js";

export type TextReportOptions = {
  cwd?: string;
  color?: boolean;
  compact?: boolean;
};

export type MachineReportOptions = {
  compact?: boolean;
};

export function formatTextReport(
  result: QualityScanResult,
  options: TextReportOptions = {},
): string {
  const colors = createColors(options.color ?? false);
  const lines = [colors.bold("llm-core-quality"), ""];

  for (const invocation of result.invocations) {
    const engineFindings = result.findings.filter(
      (finding) => finding.engine === invocation.engine,
    );
    const marker = formatEngineMarker(engineFindings, colors);
    const engineName = formatEngineName(invocation.engine);
    lines.push(
      `${marker} ${engineName} completed: ${engineFindings.length} ${pluralize("finding", engineFindings.length)}`,
    );
  }

  if (result.findings.length > 0) {
    lines.push("");
    lines.push(
      ...formatFindingGroups(result.findings, options.cwd, colors, {
        compact: options.compact ?? false,
      }),
    );
  }

  lines.push("");
  lines.push(...formatSummary(result, colors));

  return lines.join("\n");
}

export function formatJsonReport(
  result: QualityScanResult,
  options: MachineReportOptions = {},
): string {
  return `${JSON.stringify(result, null, options.compact ? 0 : 2)}\n`;
}

export function formatSarifReport(
  result: QualityScanResult,
  options: MachineReportOptions = {},
): string {
  return `${JSON.stringify(toSarif(result), null, options.compact ? 0 : 2)}\n`;
}

function formatFindingGroups(
  findings: QualityFinding[],
  cwd: string | undefined,
  colors: ReturnType<typeof createColors>,
  options: { compact: boolean },
): string[] {
  const lines: string[] = [];
  const maxRuleLength = Math.min(32, Math.max(...findings.map(ruleIdLength)));
  const grouped = groupFindingsByFile(findings, cwd);

  for (const [filePath, fileFindings] of grouped) {
    lines.push(colors.underline(filePath));

    for (const finding of fileFindings) {
      const severity = colorSeverity(finding.severity.padEnd(7), colors);
      const rule = formatRuleColumn(finding, maxRuleLength);
      const location = formatLineColumn(finding);
      const message = formatFindingMessage(finding, options);
      lines.push(
        `  ${severity}  ${colors.cyan(rule)}${message ? `  ${message}` : ""}${location ? `  ${colors.dim(location)}` : ""}`,
      );
    }

    lines.push("");
  }

  if (lines.at(-1) === "") {
    lines.pop();
  }

  return lines;
}

function groupFindingsByFile(
  findings: QualityFinding[],
  cwd: string | undefined,
): Map<string, QualityFinding[]> {
  const grouped = new Map<string, QualityFinding[]>();

  for (const finding of findings) {
    const filePath = finding.filePath
      ? formatRelativePath(finding.filePath, cwd)
      : "(project)";
    const existing = grouped.get(filePath) ?? [];
    existing.push(finding);
    grouped.set(filePath, existing);
  }

  return grouped;
}

function formatRelativePath(filePath: string, cwd: string | undefined): string {
  if (!cwd || !path.isAbsolute(filePath)) {
    return filePath;
  }

  const relativePath = path.relative(cwd, filePath);
  if (
    !relativePath ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    return filePath;
  }

  return relativePath.split(path.sep).join(path.posix.sep);
}

function formatSummary(
  result: QualityScanResult,
  colors: ReturnType<typeof createColors>,
): string[] {
  const severityCounts = countSeverities(result.findings);
  const status = result.ok ? colors.green("pass") : colors.red("fail");

  return [
    colors.bold("Summary"),
    `  errors:   ${severityCounts.error}`,
    `  warnings: ${severityCounts.warning}`,
    `  notices:  ${severityCounts.notice}`,
    `  findings: ${result.findings.length}`,
    `  status:   ${status}`,
  ];
}

function countSeverities(
  findings: QualityFinding[],
): Record<QualitySeverity, number> {
  return findings.reduce<Record<QualitySeverity, number>>(
    (counts, finding) => {
      counts[finding.severity] += 1;
      return counts;
    },
    { error: 0, warning: 0, notice: 0 },
  );
}

function formatEngineMarker(
  findings: QualityFinding[],
  colors: ReturnType<typeof createColors>,
): string {
  if (findings.some((finding) => finding.severity === "error")) {
    return colors.red("✗");
  }

  if (findings.some((finding) => finding.severity === "warning")) {
    return colors.yellow("⚠");
  }

  return colors.green("✓");
}

function formatEngineName(engine: QualityEngine): string {
  return engine === "eslint" ? "ESLint" : "Knip";
}

function colorSeverity(
  severity: string,
  colors: ReturnType<typeof createColors>,
): string {
  if (severity.trimEnd() === "error") {
    return colors.red(severity);
  }

  if (severity.trimEnd() === "warning") {
    return colors.yellow(severity);
  }

  return colors.cyan(severity);
}

function formatFindingMessage(
  finding: QualityFinding,
  options: { compact: boolean },
): string {
  if (options.compact && isLlmCoreRule(finding)) {
    return "";
  }

  return finding.message;
}

function isLlmCoreRule(finding: QualityFinding): boolean {
  return finding.ruleId?.startsWith("llm-core/") ?? false;
}

function formatRuleColumn(
  finding: QualityFinding,
  maxRuleLength: number,
): string {
  return truncateRuleId(formatRuleId(finding), maxRuleLength).padEnd(
    maxRuleLength,
  );
}

function ruleIdLength(finding: QualityFinding): number {
  return Math.min(32, formatRuleId(finding).length);
}

function formatRuleId(finding: QualityFinding): string {
  return finding.ruleId ?? finding.engine;
}

function truncateRuleId(ruleId: string, maxLength: number): string {
  if (ruleId.length <= maxLength) {
    return ruleId;
  }

  if (maxLength <= 1) {
    return ruleId.slice(0, maxLength);
  }

  return `${ruleId.slice(0, maxLength - 1)}…`;
}

function formatLineColumn(finding: QualityFinding): string {
  if (!finding.line) {
    return "";
  }

  return finding.column
    ? `${finding.line}:${finding.column}`
    : String(finding.line);
}

function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`;
}

function toSarif(result: QualityScanResult): Record<string, unknown> {
  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "llm-core-quality",
            informationUri:
              "https://github.com/pertrai1/eslint-plugin-llm-core",
            rules: buildSarifRules(result.findings),
          },
        },
        results: result.findings.map((finding) => ({
          ruleId: finding.ruleId ?? finding.engine,
          level: toSarifLevel(finding.severity),
          message: {
            text: finding.message,
          },
          locations: finding.filePath
            ? [
                {
                  physicalLocation: {
                    artifactLocation: {
                      uri: finding.filePath,
                    },
                    region: {
                      startLine: finding.line ?? 1,
                      startColumn: finding.column ?? 1,
                    },
                  },
                },
              ]
            : [],
          properties: {
            engine: finding.engine,
          },
        })),
      },
    ],
  };
}

function buildSarifRules(
  findings: QualityFinding[],
): Array<Record<string, unknown>> {
  const rules = new Map<string, Record<string, unknown>>();

  for (const finding of findings) {
    const id = finding.ruleId ?? finding.engine;
    if (!rules.has(id)) {
      rules.set(id, {
        id,
        name: id,
        shortDescription: {
          text: `${finding.engine} finding`,
        },
      });
    }
  }

  return [...rules.values()];
}

function toSarifLevel(
  severity: QualityFinding["severity"],
): "error" | "warning" | "note" {
  if (severity === "error") {
    return "error";
  }

  if (severity === "warning") {
    return "warning";
  }

  return "note";
}
