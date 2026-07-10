#!/usr/bin/env node
import { parseCliArgs } from "./cli-args.js";
import {
  formatJsonReport,
  formatSarifReport,
  formatTextReport,
} from "./reporters.js";
import { runQualityScan } from "./runner.js";

async function main(): Promise<void> {
  try {
    const parsed = parseCliArgs(process.argv.slice(2));

    if (parsed.kind === "help") {
      process.stdout.write(parsed.text);
      return;
    }

    const result = await runQualityScan(parsed.options);
    const output =
      parsed.options.reporter === "json"
        ? formatJsonReport(result)
        : parsed.options.reporter === "sarif"
          ? formatSarifReport(result)
          : `${formatTextReport(result)}\n`;

    process.stdout.write(output);
    process.exitCode = result.exitCode;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`llm-core-quality: ${message}\n`);
    process.exitCode = 1;
  }
}

await main();
