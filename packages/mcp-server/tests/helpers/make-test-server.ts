import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetActiveInstructions } from "../../src/tools/get-active-instructions.js";

/**
 * Creates a fresh McpServer with all tools registered for integration tests.
 * Kept as an async factory so each test gets an isolated server instance.
 */
export async function makeTestServer(): Promise<McpServer> {
  const server = new McpServer({ name: "test-server", version: "0.0.0" });
  registerGetActiveInstructions(server);
  return server;
}
