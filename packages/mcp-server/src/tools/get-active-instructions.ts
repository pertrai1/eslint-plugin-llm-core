import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { ESLint } from "eslint";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { generateInstructions } from "eslint-plugin-llm-core/instructions";
import {
  getConfiguredRuleInstruction,
  isEnabledRuleConfig,
  LLM_CORE_PREFIX,
} from "./rule-guidance.js";

const inputSchema = {
  configPath: z
    .string()
    .optional()
    .describe("Optional path to an ESLint config file for the overview only"),
  path: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Existing project-relative file path for exact flat-config guidance",
    ),
};

function textResult(text: string, isError = false) {
  return {
    ...(isError ? { isError: true } : {}),
    content: [{ type: "text" as const, text }],
  };
}

function isWithinRoot(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

async function getFileInstructions(projectRoot: string, filePath: string) {
  const target = path.resolve(projectRoot, filePath);
  if (path.isAbsolute(filePath) || !isWithinRoot(projectRoot, target)) {
    return textResult("Pass a file path relative to the project root.", true);
  }

  const [root, realTarget] = await Promise.all([
    realpath(projectRoot),
    realpath(target).catch(() => undefined),
  ]);
  if (realTarget !== undefined && !isWithinRoot(root, realTarget)) {
    return textResult("Pass a file path contained in the project root.", true);
  }
  const file =
    realTarget === undefined
      ? undefined
      : await stat(realTarget).catch(() => undefined);
  if (!file?.isFile()) {
    return textResult(
      "Pass the project-relative path of an existing file.",
      true,
    );
  }

  const eslint = new ESLint({ cwd: projectRoot });
  const config = await eslint.calculateConfigForFile(target);
  if (!config) {
    return textResult(
      "ESLint ignores this file or no project configuration matches it. Check the applicable file and ignore patterns.",
      true,
    );
  }

  const enabledRules = Object.entries(config.rules ?? {})
    .filter(
      ([ruleId, configEntry]) =>
        ruleId.startsWith(LLM_CORE_PREFIX) && isEnabledRuleConfig(configEntry),
    )
    .sort(([left], [right]) => left.localeCompare(right));

  const instructions = enabledRules.map(
    ([ruleId, configEntry]) =>
      `- ${getConfiguredRuleInstruction(ruleId, configEntry) ?? ruleId}`,
  );

  const name = path.relative(projectRoot, target).split(path.sep).join("/");
  const message = instructions.length
    ? instructions.join("\n")
    : "No llm-core rules are enabled for this file.";
  return textResult(`# Active lint instructions for \`${name}\`\n\n${message}`);
}

export function registerGetActiveInstructions(
  server: McpServer,
  projectRoot = process.cwd(),
): void {
  const root = path.resolve(projectRoot);
  server.registerTool(
    "get_active_instructions",
    {
      title: "Get Active Lint Instructions",
      description:
        "Pass a project-relative file path for exact ESLint flat-config guidance, " +
        "or omit it for an approximate project overview. " +
        "Use configPath only with the overview.",
      inputSchema,
    },
    async ({ configPath, path: filePath }) => {
      if (filePath !== undefined) {
        if (configPath !== undefined) {
          return textResult("Pass path or configPath, not both.", true);
        }
        return getFileInstructions(root, filePath);
      }

      const result = await generateInstructions(
        configPath ? { configPath } : undefined,
      );

      const scopeSummary = [
        `allFilesRules: ${result.allFilesRules.length}`,
        `javascriptRules: ${result.javascriptRules.length}`,
        `typescriptRules: ${result.typescriptRules.length}`,
      ].join(", ");

      const text =
        `${result.content}\n\n` +
        "Approximate overview based on representative root-level files. " +
        "Pass path for exact file-specific guidance.\n\n" +
        `<!-- scope counts: ${scopeSummary} -->`;

      return {
        _meta: {
          scopeCounts: {
            allFilesRules: result.allFilesRules.length,
            javascriptRules: result.javascriptRules.length,
            typescriptRules: result.typescriptRules.length,
          },
        },
        ...textResult(text),
      };
    },
  );
}
