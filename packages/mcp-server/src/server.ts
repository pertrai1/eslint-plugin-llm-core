#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const { version } = require("../package.json") as { version: string };

export const server = new McpServer({
  name: "eslint-plugin-llm-core-mcp",
  version,
});

// Tools and resources are registered in their own modules and wired here.
// Stubs — filled in Phase 2 and 3.

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
