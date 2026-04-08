import { mkdir, writeFile, appendFile } from "fs/promises";
import { join } from "path";
import type {
  EvalResults,
  FailurePatterns,
  FixtureResult,
  IterationRecord,
} from "./types";

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function fmt(n: number): string {
  return n.toFixed(1);
}

function formatDelta(delta: number): string {
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function formatFixtureSection(
  result: FixtureResult | undefined,
  label: string,
): string {
  if (!result) return `**${label}**: not run`;

  const lines = [
    `**${label}**: ${result.iterations} iteration${result.iterations !== 1 ? "s" : ""}`,
  ];

  if (result.iterations === 0) {
    lines.push("- Already clean — 0 iterations needed ✅");
  } else {
    for (const rec of result.iterationRecords) {
      const check = rec.violationsAfter === 0 ? " ✅" : "";
      const details: string[] = [];

      if (rec.remainingRuleIds && rec.remainingRuleIds.length > 0) {
        details.push(`remaining rules: ${rec.remainingRuleIds.join(", ")}`);
      }

      if (rec.rejectedCandidate) {
        details.push(`candidate rejected: ${rec.rejectedCandidate}`);
      }

      const suffix = details.length > 0 ? ` (${details.join("; ")})` : "";

      lines.push(
        `- Iteration ${rec.iteration}: ${rec.violationsBefore} violations → ${rec.violationsAfter} violations${check}`,
      );
      if (suffix) {
        lines[lines.length - 1] += suffix;
      }
    }
  }

  return lines.join("\n");
}

function hasPatterns(patterns: FailurePatterns | undefined): boolean {
  if (!patterns) return false;
  return (
    patterns.stuckRules.length > 0 ||
    patterns.oscillatingRules.length > 0 ||
    patterns.cascadingErrors
  );
}

function formatDiagnostics(result: FixtureResult): string {
  if (!hasPatterns(result.patterns)) return "";

  const modeLabel = result.mode === "treatment" ? "treatment" : "control";
  const p = result.patterns!;
  const lines = ["", `### Diagnostics (${modeLabel})`];

  if (p.stuckRules.length > 0) {
    lines.push(`- **Stuck rules**: ${p.stuckRules.join(", ")}`);
  }
  if (p.oscillatingRules.length > 0) {
    lines.push(`- **Oscillating rules**: ${p.oscillatingRules.join(", ")}`);
  }
  if (p.cascadingErrors) {
    lines.push(
      "- **Cascading errors**: at least one iteration introduced new violations",
    );
  }

  return lines.join("\n");
}

const TRACE_FIELDS: (keyof IterationRecord)[] = [
  "promptSent",
  "llmResponse",
  "codeDiff",
  "reasoning",
];

function stripTraceFields(record: IterationRecord): IterationRecord {
  const stripped = { ...record };
  for (const field of TRACE_FIELDS) {
    delete stripped[field];
  }
  return stripped;
}

export function generateCompactJson(results: EvalResults): string {
  const compacted: EvalResults = {
    ...results,
    results: results.results.map((r) => {
      if (r.resolved) {
        return {
          ...r,
          iterationRecords: r.iterationRecords.map(stripTraceFields),
        };
      }
      return r;
    }),
  };
  return JSON.stringify(compacted, null, 2);
}

export function generateHistoryLine(results: EvalResults): string[] {
  return results.results.map((r) =>
    JSON.stringify({
      date: results.date,
      model: results.model,
      pluginVersion: results.pluginVersion,
      fixture: r.fixture,
      mode: r.mode,
      iterations: r.iterations,
      resolved: r.resolved,
      finalViolationCount: r.finalViolationCount,
    }),
  );
}

export function generateJson(results: EvalResults): string {
  return JSON.stringify(results, null, 2);
}

export function generateMarkdown(results: EvalResults): string {
  const { date, model, pluginVersion } = results;

  const treatmentResults = results.results.filter(
    (r) => r.mode === "treatment",
  );
  const controlResults = results.results.filter((r) => r.mode === "control");
  const fixtureNames = [...new Set(results.results.map((r) => r.fixture))].sort(
    (a, b) => a.localeCompare(b),
  );

  const summaryRows = fixtureNames.map((name) => {
    const t = treatmentResults.find((r) => r.fixture === name);
    const c = controlResults.find((r) => r.fixture === name);
    const ti = t?.iterations ?? "-";
    const ci = c?.iterations ?? "-";
    const delta =
      typeof ti === "number" && typeof ci === "number"
        ? formatDelta(ti - ci)
        : "-";
    return `| ${name} | ${ti} | ${ci} | ${delta} |`;
  });

  const tAvg = average(treatmentResults.map((r) => r.iterations));
  const cAvg = average(controlResults.map((r) => r.iterations));
  const deltaAvg = tAvg - cAvg;
  const pct =
    cAvg > 0
      ? ` (${Math.abs(Math.round((deltaAvg / cAvg) * 100))}% ${deltaAvg < 0 ? "fewer" : "more"})`
      : "";
  const deltaAvgStr =
    deltaAvg === 0 ? "0" : deltaAvg > 0 ? `+${fmt(deltaAvg)}` : fmt(deltaAvg);

  const summaryTable = [
    `| Fixture | Treatment (iterations) | Control (iterations) | Δ |`,
    `|---------|----------------------|---------------------|---|`,
    ...summaryRows,
    `| **Average** | **${fmt(tAvg)}** | **${fmt(cAvg)}** | **${deltaAvgStr}${pct}** |`,
  ].join("\n");

  const perFixture = fixtureNames
    .map((name) => {
      const t = treatmentResults.find((r) => r.fixture === name);
      const c = controlResults.find((r) => r.fixture === name);
      const sections = [
        `### ${name}`,
        formatFixtureSection(t, "Treatment (full messages)"),
        "",
        formatFixtureSection(c, "Control (first-line only)"),
      ];

      const tDiag = t ? formatDiagnostics(t) : "";
      const cDiag = c ? formatDiagnostics(c) : "";
      if (tDiag) sections.push(tDiag);
      if (cDiag) sections.push(cDiag);

      return sections.join("\n");
    })
    .join("\n\n");

  return [
    "# Fix-Iteration Eval Results",
    "",
    `**Date**: ${date}`,
    `**Model**: ${model}`,
    `**Plugin version**: ${pluginVersion}`,
    "",
    "## Summary",
    "",
    summaryTable,
    "",
    "## Per-Fixture Details",
    "",
    perFixture,
  ].join("\n");
}

export async function writeReports(
  results: EvalResults,
  outputDir: string,
  options: { compact?: boolean } = {},
): Promise<{ jsonPath: string; mdPath: string; historyPath: string }> {
  await mkdir(outputDir, { recursive: true });

  const slug = results.date.replace(/[^a-zA-Z0-9._-]/g, "-");
  const jsonPath = join(outputDir, `eval-${slug}.json`);
  const mdPath = join(outputDir, `eval-${slug}.md`);
  const historyPath = join(outputDir, "history.jsonl");

  const json = options.compact
    ? generateCompactJson(results)
    : generateJson(results);

  await writeFile(jsonPath, json);
  await writeFile(mdPath, generateMarkdown(results));

  const historyLines = generateHistoryLine(results);
  if (historyLines.length > 0) {
    await appendFile(historyPath, historyLines.join("\n") + "\n");
  }

  return { jsonPath, mdPath, historyPath };
}
