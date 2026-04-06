import { readFile, readdir } from "fs/promises";
import { join, resolve } from "path";
import type { EvalConfig, EvalMode, EvalResults, FixtureResult } from "./types";
import { runFixture } from "./eval-loop";
import { writeReports } from "./reporter";

const DEFAULTS = {
  mode: "both" as const,
  model: "claude-sonnet-4-20250514",
  maxIterations: 5,
  outputDir: resolve(__dirname, "../results"),
};

function printHelp(): void {
  process.stdout.write(`
Usage: npx tsx evals/src/run-eval.ts [options]

Options:
  --mode treatment|control|both   Run mode (default: both)
  --model <name>                  Anthropic model (default: ${DEFAULTS.model})
  --fixture <name>                Run specific fixture only (repeatable)
  --max-iterations <n>            Max iterations per fixture (default: ${DEFAULTS.maxIterations})
  --output <dir>                  Output directory (default: evals/results)
  --help                          Show this help

Environment:
  ANTHROPIC_API_KEY               Required: your Anthropic API key

Examples:
  npx tsx evals/src/run-eval.ts
  npx tsx evals/src/run-eval.ts --mode treatment
  npx tsx evals/src/run-eval.ts --fixture error-handling.ts --max-iterations 3
`);
}

function parseArgs(argv: string[]): EvalConfig {
  const args = argv.slice(2);

  const config: EvalConfig = {
    mode: DEFAULTS.mode,
    model: DEFAULTS.model,
    fixtureFilter: [],
    maxIterations: DEFAULTS.maxIterations,
    outputDir: DEFAULTS.outputDir,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    if (arg === "--help") {
      printHelp();
      process.exit(0);
    } else if (arg === "--mode" && next) {
      if (next !== "treatment" && next !== "control" && next !== "both") {
        process.stderr.write(
          `Invalid --mode "${next}". Use: treatment, control, both\n`,
        );
        process.exit(1);
      }
      config.mode = next;
      i++;
    } else if (arg === "--model" && next) {
      config.model = next;
      i++;
    } else if (arg === "--fixture" && next) {
      config.fixtureFilter.push(next);
      i++;
    } else if (arg === "--max-iterations" && next) {
      const n = parseInt(next, 10);
      if (isNaN(n) || n < 1) {
        process.stderr.write(
          `Invalid --max-iterations "${next}". Must be a positive integer.\n`,
        );
        process.exit(1);
      }
      config.maxIterations = n;
      i++;
    } else if (arg === "--output" && next) {
      config.outputDir = resolve(next);
      i++;
    }
  }

  return config;
}

async function resolveFixturePaths(
  fixturesDir: string,
  filter: string[],
): Promise<string[]> {
  const allFiles = await readdir(fixturesDir);
  const tsFiles = allFiles.filter((f) => f.endsWith(".ts"));

  if (filter.length === 0) {
    return tsFiles.map((f) => join(fixturesDir, f));
  }

  return filter.flatMap((name) => {
    const filename = name.endsWith(".ts") ? name : `${name}.ts`;
    if (!tsFiles.includes(filename)) {
      process.stderr.write(
        `Warning: fixture "${filename}" not found — skipping\n`,
      );
      return [];
    }
    return [join(fixturesDir, filename)];
  });
}

async function getPluginVersion(): Promise<string> {
  try {
    const raw = await readFile(
      resolve(__dirname, "../../package.json"),
      "utf-8",
    );
    const pkg = JSON.parse(raw) as { version: string };
    return pkg.version;
  } catch {
    return "unknown";
  }
}

async function main(): Promise<void> {
  const config = parseArgs(process.argv);
  const fixturesDir = resolve(__dirname, "../fixtures");
  const fixturePaths = await resolveFixturePaths(
    fixturesDir,
    config.fixtureFilter,
  );

  if (fixturePaths.length === 0) {
    process.stderr.write("No fixture files found.\n");
    process.exit(1);
  }

  process.stdout.write(`Running evals\n`);
  process.stdout.write(`  mode:           ${config.mode}\n`);
  process.stdout.write(`  model:          ${config.model}\n`);
  process.stdout.write(`  fixtures:       ${fixturePaths.length}\n`);
  process.stdout.write(`  max-iterations: ${config.maxIterations}\n\n`);

  const modes: EvalMode[] =
    config.mode === "both" ? ["treatment", "control"] : [config.mode];

  const results: FixtureResult[] = [];

  for (const fixturePath of fixturePaths) {
    for (const mode of modes) {
      const name = fixturePath.split("/").pop() ?? fixturePath;
      process.stdout.write(`  ${name} [${mode}] ... `);
      try {
        const result = await runFixture(fixturePath, mode, {
          model: config.model,
          maxIterations: config.maxIterations,
        });
        results.push(result);
        const status = result.resolved
          ? `✅ resolved in ${result.iterations} iteration(s)`
          : `❌ ${result.finalViolationCount} violation(s) remaining after ${result.iterations} iteration(s)`;
        process.stdout.write(`${status}\n`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        process.stdout.write(`❌ error: ${msg}\n`);
      }
    }
  }

  const pluginVersion = await getPluginVersion();

  const evalResults: EvalResults = {
    date: new Date().toISOString().split("T")[0] ?? new Date().toISOString(),
    model: config.model,
    pluginVersion,
    results,
  };

  const { jsonPath, mdPath } = await writeReports(
    evalResults,
    config.outputDir,
  );

  process.stdout.write(`\nReports written:\n`);
  process.stdout.write(`  JSON: ${jsonPath}\n`);
  process.stdout.write(`  MD:   ${mdPath}\n`);
}

main().catch((err) => {
  process.stderr.write(
    `Fatal: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
