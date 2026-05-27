import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerRuleDocResource } from "./rule-doc.js";
import { registerRulesListResource } from "./rules-list.js";

export function registerRuleResources(server: McpServer): void {
  registerRulesListResource(server);
  registerRuleDocResource(server);
}
