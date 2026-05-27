#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createRequire } from "node:module";
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

// Only start when run directly (not imported in tests).
if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  startServer().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
