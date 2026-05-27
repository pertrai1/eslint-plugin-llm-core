import path from "node:path";
import { loadESLint } from "eslint";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// ESM importing the CJS plugin's ./instructions subpath via interop.
import { getRuleInstruction } from "eslint-plugin-llm-core/instructions";

const LLM_CORE_PREFIX = "llm-core/";

/**
 * Options that configure the lint_file tool at registration time. Kept separate
 * from the per-call `path` input so tests can target a self-contained fixture
 * project (ESLint cwd + sandbox root) and exercise the directory cap.
 */
export interface LintFileOptions {
  /** Project root used as the ESLint cwd and sandbox boundary. */
  projectRoot?: string;
}

interface LintViolation {
  ruleId: string;
  line: number;
  column: number;
  severity: number;
  message: string;
  instruction: string | undefined;
}

interface FlatLintMessage {
  ruleId: string | null;
  line: number;
  column: number;
  severity: number;
  message: string;
}

interface FlatLintResult {
  filePath: string;
  messages: FlatLintMessage[];
}

interface FlatESLintInstance {
  lintFiles(patterns: string[]): Promise<FlatLintResult[]>;
}

type FlatESLintConstructor = new (options?: {
  cwd?: string;
}) => FlatESLintInstance;

const inputSchema = {
  path: z
    .string()
    .describe("Path to a file or directory to lint, within the project root"),
};

async function createFlatESLint(cwd: string): Promise<FlatESLintInstance> {
  // ESLint's exported types do not surface the flat-config overload; the cast
  // matches the runtime shape (mirrors src/instructions/config-resolver.ts).
  const loadFlatESLint = loadESLint as unknown as (options: {
    useFlatConfig: boolean;
  }) => Promise<FlatESLintConstructor>;
  const ESLint = await loadFlatESLint({ useFlatConfig: true });
  return new ESLint({ cwd });
}

function toViolations(results: FlatLintResult[]): LintViolation[] {
  const violations: LintViolation[] = [];

  for (const result of results) {
    for (const message of result.messages) {
      const ruleId = message.ruleId;
      if (!ruleId || !ruleId.startsWith(LLM_CORE_PREFIX)) {
        continue;
      }

      violations.push({
        ruleId,
        line: message.line,
        column: message.column,
        severity: message.severity,
        message: message.message,
        instruction: getRuleInstruction(ruleId),
      });
    }
  }

  return violations;
}

export function registerLintFile(
  server: McpServer,
  options: LintFileOptions = {},
): void {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());

  server.registerTool(
    "lint_file",
    {
      title: "Lint a File for llm-core Violations",
      description:
        "Lints a file (or directory) with the project's own ESLint config and " +
        "returns each eslint-plugin-llm-core violation with its what/why/how-to-fix " +
        "instruction attached. Call after editing a file to self-correct.",
      inputSchema,
    },
    async ({ path: targetPath }) => {
      const absoluteTarget = path.resolve(projectRoot, targetPath);

      const eslint = await createFlatESLint(projectRoot);
      const results = await eslint.lintFiles([absoluteTarget]);
      const violations = toViolations(results);

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(violations, null, 2) },
        ],
      };
    },
  );
}
