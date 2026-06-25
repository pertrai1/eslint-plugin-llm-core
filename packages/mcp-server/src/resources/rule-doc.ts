import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import {
  ResourceTemplate,
  type McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getRuleListEntries, getRuleNames } from "./rule-data.js";

const RULE_DOC_TEMPLATE = "llm-core://rules/{ruleName}";
const MAX_DIR_DEPTH = 8;

let docsCache: Promise<Record<string, string>> | undefined;

async function readDocsFromRepo(): Promise<Record<string, string>> {
  let current = dirname(fileURLToPath(import.meta.url));

  for (let depth = 0; depth < MAX_DIR_DEPTH; depth += 1) {
    const docsDir = join(current, "docs", "rules");
    const files = await readdir(docsDir).catch(() => null);

    if (files) {
      const entries = await Promise.all(
        files
          .filter((file) => file.endsWith(".md"))
          .map(async (file) => [
            basename(file, ".md"),
            await readFile(join(docsDir, file), "utf8"),
          ]),
      );

      return Object.fromEntries(entries);
    }

    const parent = dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return {};
}

async function loadDocs(): Promise<Record<string, string>> {
  if (!docsCache) {
    docsCache = (async () => {
      const generatedModulePath = "../embedded-docs.js";
      const generated = (await import(generatedModulePath).catch(
        () => null,
      )) as { embeddedDocs?: Record<string, string> } | null;

      return generated?.embeddedDocs ?? readDocsFromRepo();
    })();
  }

  return docsCache;
}

function ruleNameFromVariables(ruleName: unknown): string {
  return Array.isArray(ruleName) ? String(ruleName[0] ?? "") : String(ruleName);
}

export function registerRuleDocResource(server: McpServer): void {
  const template = new ResourceTemplate(RULE_DOC_TEMPLATE, {
    list: async () => ({
      resources: getRuleListEntries().map((rule) => ({
        uri: `llm-core://rules/${rule.name}`,
        name: rule.name,
        description: rule.description,
        mimeType: "text/markdown",
      })),
    }),
    complete: {
      ruleName: (value) =>
        getRuleNames().filter((ruleName) => ruleName.startsWith(value)),
    },
  });

  server.registerResource(
    "llm-core-rule-doc",
    template,
    {
      title: "llm-core Rule Documentation",
      description: "Full markdown documentation for a single llm-core rule.",
      mimeType: "text/markdown",
    },
    async (uri, variables) => {
      const ruleName = ruleNameFromVariables(variables.ruleName);
      const docs = await loadDocs();
      const markdown = docs[ruleName];

      if (!markdown) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Unknown llm-core rule "${ruleName}". Available rules: ${getRuleNames().join(", ")}`,
        );
      }

      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: "text/markdown",
            text: markdown,
          },
        ],
      };
    },
  );
}
