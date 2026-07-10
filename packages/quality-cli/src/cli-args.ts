import { DEFAULT_ENGINES } from "./runner.js";
import type {
  QualityEngine,
  QualityReporter,
  QualityScanOptions,
} from "./types.js";

export type ParsedCli =
  | {
      kind: "help";
      text: string;
    }
  | {
      kind: "run";
      options: QualityScanOptions;
    };

export function parseCliArgs(args: string[], cwd = process.cwd()): ParsedCli {
  const [commandArg, ...rest] = args;

  if (!commandArg || commandArg === "--help" || commandArg === "-h") {
    return { kind: "help", text: HELP_TEXT };
  }

  if (commandArg !== "scan" && commandArg !== "ci") {
    throw new Error(`Unknown command: ${commandArg}`);
  }

  let reporter: QualityReporter = "text";
  const engines = new Set<QualityEngine>();
  const targets: string[] = [];
  let failOnFindings = commandArg === "ci";

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--json") {
      reporter = "json";
      continue;
    }

    if (arg === "--sarif") {
      reporter = "sarif";
      continue;
    }

    if (arg === "--no-exit-code") {
      failOnFindings = false;
      continue;
    }

    if (arg === "--fail-on-findings") {
      failOnFindings = true;
      continue;
    }

    if (arg === "--engine") {
      const value = rest[index + 1];
      if (!value) {
        throw new Error(
          "--engine requires eslint, knip, or a comma-separated list",
        );
      }
      addEngines(engines, value);
      index += 1;
      continue;
    }

    if (arg?.startsWith("--engine=")) {
      addEngines(engines, arg.slice("--engine=".length));
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return { kind: "help", text: HELP_TEXT };
    }

    if (arg?.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    targets.push(arg);
  }

  return {
    kind: "run",
    options: {
      command: commandArg,
      reporter,
      cwd,
      targets,
      engines: engines.size > 0 ? [...engines] : DEFAULT_ENGINES,
      failOnFindings,
    },
  };
}

function addEngines(engines: Set<QualityEngine>, value: string): void {
  for (const engine of value.split(",")) {
    if (engine !== "eslint" && engine !== "knip") {
      throw new Error(`Unknown engine: ${engine}`);
    }
    engines.add(engine);
  }
}

export const HELP_TEXT = `llm-core-quality

Usage:
  llm-core-quality scan [--json|--sarif] [--engine eslint|knip] [targets...]
  llm-core-quality ci [--json|--sarif] [--engine eslint|knip] [targets...]

Commands:
  scan  Run quality engines and print a report. Findings do not fail by default.
  ci    Run quality engines for CI. Findings fail by default.

Options:
  --json              Print normalized JSON.
  --sarif             Print SARIF 2.1.0.
  --engine <engine>   Limit engines. Repeat or comma-separate: eslint,knip.
  --fail-on-findings  Exit non-zero when findings are present.
  --no-exit-code      Always exit zero unless a tool execution fails.
  -h, --help          Show help.
`;
