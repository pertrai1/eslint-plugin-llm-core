#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerRuleResources } from "./resources/index.js";
import { registerGetActiveInstructions } from "./tools/get-active-instructions.js";
import { registerLintFile } from "./tools/lint-file.js";

const require = createRequire(import.meta.url);

const { version } = require("../package.json") as { version: string };

export const server = new McpServer({
  name: "eslint-plugin-llm-core-mcp",
  version,
});

// Tools
registerGetActiveInstructions(server);
registerLintFile(server);

// Resources
registerRuleResources(server);

export async function startServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function realPathOrResolved(filePath: string): string {
  try {
    return realpathSync(filePath);
  } catch {
    return path.resolve(filePath);
  }
}

export function isDirectRun(
  entryPoint: string | undefined = process.argv[1],
  moduleUrl: string = import.meta.url,
): boolean {
  if (!entryPoint) {
    return false;
  }

  return (
    realPathOrResolved(entryPoint) ===
    realPathOrResolved(fileURLToPath(moduleUrl))
  );
}

// Only start when run directly (not imported in tests).
if (isDirectRun()) {
  startServer().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
