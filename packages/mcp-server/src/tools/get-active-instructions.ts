import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// ESM can import CJS modules via default-export interop; the subpath export
// resolves to dist/instructions/index.js which is CommonJS.
import { generateInstructions } from "eslint-plugin-llm-core/instructions";

const inputSchema = {
  configPath: z
    .string()
    .optional()
    .describe("Optional path to an ESLint config file"),
};

export function registerGetActiveInstructions(server: McpServer): void {
  server.registerTool(
    "get_active_instructions",
    {
      title: "Get Active Lint Instructions",
      description:
        "Returns the full active rule guidance markdown for the current project. " +
        "Call once at session start to orient without keeping rules in the prompt every turn.",
      inputSchema,
    },
    async ({ configPath }) => {
      const result = await generateInstructions(
        configPath ? { configPath } : undefined,
      );

      const scopeSummary = [
        `allFilesRules: ${result.allFilesRules.length}`,
        `javascriptRules: ${result.javascriptRules.length}`,
        `typescriptRules: ${result.typescriptRules.length}`,
      ].join(", ");

      const text = `${result.content}\n\n<!-- scope counts: ${scopeSummary} -->`;

      return {
        content: [{ type: "text" as const, text }],
      };
    },
  );
}
