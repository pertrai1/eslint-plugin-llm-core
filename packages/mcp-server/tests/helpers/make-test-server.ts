import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetActiveInstructions } from "../../src/tools/get-active-instructions.js";
import {
  registerLintFile,
  type LintFileOptions,
} from "../../src/tools/lint-file.js";
import { registerRuleResources } from "../../src/resources/index.js";

/**
 * Options forwarded to the lint_file tool registration so integration tests can
 * point the tool at a self-contained fixture project (ESLint cwd + sandbox root)
 * and exercise the directory file-count cap.
 */
export type MakeTestServerOptions = LintFileOptions;

/**
 * Creates a fresh McpServer with all tools registered for integration tests.
 * Kept as an async factory so each test gets an isolated server instance.
 */
export async function makeTestServer(
  lintFileOptions?: MakeTestServerOptions,
): Promise<McpServer> {
  const server = new McpServer({ name: "test-server", version: "0.0.0" });
  registerGetActiveInstructions(server);
  registerLintFile(server, lintFileOptions);
  registerRuleResources(server);
  return server;
}
