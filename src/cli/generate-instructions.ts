#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { generateInstructions } from "../generate-instructions";
import { injectReferences } from "./inject-references";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let configPath: string | undefined;
  let dryRun = false;
  let noInject = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--config" && args[i + 1]) {
      configPath = args[++i];
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    } else if (args[i] === "--no-inject") {
      noInject = true;
    }
  }

  const result = await generateInstructions({ configPath });

  if (dryRun) {
    process.stdout.write(result.content);
    return;
  }

  const agentsDir = path.join(process.cwd(), ".agents");
  if (!fs.existsSync(agentsDir)) {
    fs.mkdirSync(agentsDir, { recursive: true });
  }

  const outputPath = path.join(agentsDir, "linting-rules.md");
  fs.writeFileSync(outputPath, result.content, "utf-8");
  console.log(`Generated ${outputPath}`);

  if (!noInject) {
    const modified = injectReferences(process.cwd());
    for (const file of modified) {
      console.log(`Injected reference into ${file}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(
    "Error:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
