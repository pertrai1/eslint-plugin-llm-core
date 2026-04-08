import { readFile } from "fs/promises";
import { resolve, join } from "path";
import type { EvalResults } from "./types";
import { queryByRule, queryUnresolved, queryStuckRules } from "./query";

const DEFAULTS = {
  outputDir: resolve(__dirname, "../results"),
};

function printHelp(): void {
  process.stdout.write(`
Usage: npx tsx evals/src/run-query.ts <query> [options]

Queries:
  --by-rule          Show per-rule appearance counts across all runs
  --unresolved       Show fixtures that were never fully resolved
  --stuck-rules      Show rules that persisted across all iterations

Options:
  --mode <mode>      Filter by mode (treatment|control)
  --input <dir>      Results directory (default: evals/results)
  --help             Show this help

Examples:
  npx tsx evals/src/run-query.ts --by-rule
  npx tsx evals/src/run-query.ts --unresolved --mode control
  npx tsx evals/src/run-query.ts --stuck-rules
`);
}

interface QueryConfig {
  query: "by-rule" | "unresolved" | "stuck-rules" | null;
  mode: string | null;
  inputDir: string;
}

function parseArgs(argv: string[]): QueryConfig {
  const args = argv.slice(2);

  const config: QueryConfig = {
    query: null,
    mode: null,
    inputDir: DEFAULTS.outputDir,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    if (arg === "--help") {
      printHelp();
      process.exit(0);
    } else if (arg === "--by-rule") {
      config.query = "by-rule";
    } else if (arg === "--unresolved") {
      config.query = "unresolved";
    } else if (arg === "--stuck-rules") {
      config.query = "stuck-rules";
    } else if (arg === "--mode" && next) {
      if (next !== "treatment" && next !== "control") {
        process.stderr.write(
          `Invalid --mode "${next}". Use: treatment or control.\n`,
        );
        process.exit(1);
      }
      config.mode = next;
      i++;
    } else if (arg === "--input" && next) {
      config.inputDir = resolve(next);
      i++;
    }
  }

  return config;
}

async function loadResults(inputDir: string): Promise<EvalResults[]> {
  const { readdir } = await import("fs/promises");
  const files = await readdir(inputDir);
  const jsonFiles = files
    .filter((f) => f.startsWith("eval-") && f.endsWith(".json"))
    .sort();

  const results: EvalResults[] = [];
  for (const file of jsonFiles) {
    const raw = await readFile(join(inputDir, file), "utf-8");
    results.push(JSON.parse(raw) as EvalResults);
  }

  return results;
}

function filterByMode(runs: EvalResults[], mode: string | null): EvalResults[] {
  if (!mode) return runs;
  return runs.map((run) => ({
    ...run,
    results: run.results.filter((r) => r.mode === mode),
  }));
}

async function main(): Promise<void> {
  const config = parseArgs(process.argv);

  if (!config.query) {
    process.stderr.write(
      "No query specified. Use --by-rule, --unresolved, or --stuck-rules.\n",
    );
    process.exit(1);
  }

  const runs = filterByMode(await loadResults(config.inputDir), config.mode);

  if (runs.length === 0) {
    process.stderr.write("No result files found.\n");
    process.exit(1);
  }

  const totalResults = runs.reduce((n, r) => n + r.results.length, 0);
  if (totalResults === 0) {
    process.stderr.write(
      config.mode
        ? `No results found for mode "${config.mode}".\n`
        : "No results found.\n",
    );
    process.exit(1);
  }

  switch (config.query) {
    case "by-rule": {
      const results = queryByRule(runs);
      process.stdout.write("Rule appearances across all runs:\n\n");
      for (const r of results) {
        process.stdout.write(`  ${r.ruleId}: ${r.appearances}\n`);
      }
      break;
    }
    case "unresolved": {
      const results = queryUnresolved(runs);
      if (results.length === 0) {
        process.stdout.write("All fixtures resolved across all runs.\n");
      } else {
        process.stdout.write("Unresolved fixtures:\n\n");
        for (const r of results) {
          process.stdout.write(
            `  ${r.date} ${r.fixture} [${r.mode}] — ${r.finalViolationCount} remaining\n`,
          );
        }
      }
      break;
    }
    case "stuck-rules": {
      const results = queryStuckRules(runs);
      if (results.length === 0) {
        process.stdout.write("No stuck rules found.\n");
      } else {
        process.stdout.write("Stuck rules:\n\n");
        for (const r of results) {
          process.stdout.write(
            `  ${r.date} ${r.fixture} [${r.mode}] — ${r.ruleId}\n`,
          );
        }
      }
      break;
    }
  }
}

main().catch((err) => {
  process.stderr.write(
    `Fatal: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
