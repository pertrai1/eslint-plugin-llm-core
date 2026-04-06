import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import type { EvalResults, FixtureResult } from "./types";

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
      lines.push(
        `- Iteration ${rec.iteration}: ${rec.violationsBefore} violations → ${rec.violationsAfter} violations${check}`,
      );
    }
  }

  return lines.join("\n");
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
      return [
        `### ${name}`,
        formatFixtureSection(t, "Treatment (full messages)"),
        "",
        formatFixtureSection(c, "Control (first-line only)"),
      ].join("\n");
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
): Promise<{ jsonPath: string; mdPath: string }> {
  await mkdir(outputDir, { recursive: true });

  const slug = results.date.replace(/[^a-zA-Z0-9._-]/g, "-");
  const jsonPath = join(outputDir, `eval-${slug}.json`);
  const mdPath = join(outputDir, `eval-${slug}.md`);

  await writeFile(jsonPath, generateJson(results));
  await writeFile(mdPath, generateMarkdown(results));

  return { jsonPath, mdPath };
}
