import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCategoryCounts, getRuleListEntries } from "./rule-data.js";

const RULES_URI = "llm-core://rules";

export function registerRulesListResource(server: McpServer): void {
  server.registerResource(
    "llm-core-rules",
    RULES_URI,
    {
      title: "llm-core Rule Listing",
      description: "Lists every eslint-plugin-llm-core rule and its category.",
      mimeType: "application/json",
    },
    async () => {
      const rules = getRuleListEntries();
      const payload = {
        total: rules.length,
        categories: getCategoryCounts(rules),
        rules,
      };

      return {
        contents: [
          {
            uri: RULES_URI,
            mimeType: "application/json",
            text: JSON.stringify(payload, null, 2),
          },
        ],
      };
    },
  );
}
