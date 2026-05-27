import path from "node:path";
import { loadESLint } from "eslint";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// ESM importing the CJS plugin's ./instructions subpath via interop.
import { getRuleInstruction } from "eslint-plugin-llm-core/instructions";
// Default export = the plugin object; plugin.rules[name].defaultOptions is the
// public source of a rule's defaults, merged in so option-template placeholders
// resolve even when a project enables a rule without explicit options.
import plugin from "eslint-plugin-llm-core";

const LLM_CORE_PREFIX = "llm-core/";

const NO_CONFIG_MESSAGE = [
  "No ESLint configuration was discovered for this path.",
  "",
  "lint_file lints using your project's own ESLint config; in v1 it does not",
  "fall back to a built-in config. To use it, install and configure",
  "eslint-plugin-llm-core in your project:",
  "",
  "  npm install --save-dev eslint eslint-plugin-llm-core",
  "",
  "Then add it to your flat config (eslint.config.js), for example:",
  "",
  '  import llmCore from "eslint-plugin-llm-core";',
  "  export default [...llmCore.configs.recommended];",
].join("\n");

function isNoConfigError(error: unknown): boolean {
  return (
    error instanceof Error && /could not find config file/i.test(error.message)
  );
}

interface RuleModuleWithDefaults {
  defaultOptions?: readonly unknown[];
}

const coreRules = (
  plugin as unknown as { rules: Record<string, RuleModuleWithDefaults> }
).rules;

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

interface ResolvedFileConfig {
  rules?: Record<string, unknown>;
}

interface FlatESLintInstance {
  lintFiles(patterns: string[]): Promise<FlatLintResult[]>;
  calculateConfigForFile(filePath: string): Promise<ResolvedFileConfig>;
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A rule's default options object from the public plugin export. */
function getRuleDefaultOptions(bareName: string): Record<string, unknown> {
  const first = coreRules[bareName]?.defaultOptions?.[0];
  return isPlainObject(first) ? { ...first } : {};
}

/**
 * Resolves the options a rule effectively fired with: the rule's defaults
 * merged with whatever the project's config configured. Mirrors the core
 * plugin's own option resolution so instructions interpolate identically.
 */
function resolveRuleOptions(
  ruleId: string,
  configEntry: unknown,
): Record<string, unknown> {
  const bareName = ruleId.slice(LLM_CORE_PREFIX.length);
  const defaults = getRuleDefaultOptions(bareName);

  if (Array.isArray(configEntry)) {
    const configured = configEntry[1];
    return isPlainObject(configured)
      ? { ...defaults, ...configured }
      : { ...defaults };
  }

  return { ...defaults };
}

async function toViolations(
  results: FlatLintResult[],
  eslint: FlatESLintInstance,
): Promise<LintViolation[]> {
  const violations: LintViolation[] = [];

  for (const result of results) {
    const hasLlmCore = result.messages.some((m) =>
      m.ruleId?.startsWith(LLM_CORE_PREFIX),
    );
    // Resolve the file's config once (only when it has llm-core diagnostics) so
    // option-template placeholders interpolate against the configured options.
    const fileRules = hasLlmCore
      ? ((await eslint.calculateConfigForFile(result.filePath)).rules ?? {})
      : {};

    for (const message of result.messages) {
      const ruleId = message.ruleId;
      if (!ruleId || !ruleId.startsWith(LLM_CORE_PREFIX)) {
        continue;
      }

      const options = resolveRuleOptions(ruleId, fileRules[ruleId]);

      violations.push({
        ruleId,
        line: message.line,
        column: message.column,
        severity: message.severity,
        message: message.message,
        instruction: getRuleInstruction(ruleId, options),
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

      let results: FlatLintResult[];
      try {
        results = await eslint.lintFiles([absoluteTarget]);
      } catch (error) {
        if (isNoConfigError(error)) {
          return {
            content: [{ type: "text" as const, text: NO_CONFIG_MESSAGE }],
          };
        }
        throw error;
      }

      const violations = await toViolations(results, eslint);

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(violations, null, 2) },
        ],
      };
    },
  );
}
