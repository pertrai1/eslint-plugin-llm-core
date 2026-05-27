import path from "node:path";
import { readdir, realpath, stat } from "node:fs/promises";
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

// Default directory-lint cap (Assumption A1); validated/tuned by sub-task 3.7.
const DEFAULT_MAX_FILES = 200;

// Extensions ESLint may lint; used to estimate a directory's size for the cap.
const LINTABLE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

// Directories excluded from the file-count estimate (never linted in practice).
const SKIPPED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
]);

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
  const maybeEslintError = error as { messageTemplate?: unknown };

  return (
    error instanceof Error &&
    (maybeEslintError.messageTemplate === "config-file-missing" ||
      /could not find config file/i.test(error.message))
  );
}

/** True when `absoluteTarget` is the project root or nested inside it. */
function isWithinRoot(absoluteTarget: string, root: string): boolean {
  const relative = path.relative(root, absoluteTarget);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

/**
 * Counts lintable source files under `dir`, short-circuiting once the count
 * exceeds `limit`. A conservative estimate for the directory guard — it ignores
 * ESLint's own ignore rules, so it may over-count, which only makes the guard
 * safer.
 */
async function countSourceFiles(dir: string, limit: number): Promise<number> {
  let count = 0;
  const pending: string[] = [dir];

  while (pending.length > 0) {
    const current = pending.pop() as string;
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) {
          pending.push(path.join(current, entry.name));
        }
      } else if (
        entry.isFile() &&
        LINTABLE_EXTENSIONS.has(path.extname(entry.name))
      ) {
        count += 1;
        if (count > limit) {
          return count;
        }
      }
    }
  }

  return count;
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
  /**
   * Maximum number of lintable files a directory target may contain before the
   * tool refuses and asks the caller to narrow the path (FR-13). Defaults to
   * {@link DEFAULT_MAX_FILES}.
   */
  maxFiles?: number;
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
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;

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
      const realProjectRoot = await realpath(projectRoot).catch(
        () => projectRoot,
      );

      if (!isWithinRoot(absoluteTarget, projectRoot)) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text:
                `Refusing to lint "${targetPath}": it resolves outside the ` +
                `project root (${projectRoot}). Pass a path within the project root.`,
            },
          ],
        };
      }

      const targetStat = await stat(absoluteTarget).catch(() => null);
      const realTarget = targetStat
        ? await realpath(absoluteTarget).catch(() => absoluteTarget)
        : absoluteTarget;

      if (targetStat && !isWithinRoot(realTarget, realProjectRoot)) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text:
                `Refusing to lint "${targetPath}": it resolves outside the ` +
                `project root (${projectRoot}). Pass a path within the project root.`,
            },
          ],
        };
      }

      if (targetStat?.isDirectory()) {
        const fileCount = await countSourceFiles(realTarget, maxFiles);
        if (fileCount > maxFiles) {
          return {
            content: [
              {
                type: "text" as const,
                text:
                  `"${targetPath}" contains more than ${maxFiles} lintable files. ` +
                  `Narrow the path to a specific file or subdirectory, or raise the ` +
                  `configured maxFiles cap.`,
              },
            ],
          };
        }
      }

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
