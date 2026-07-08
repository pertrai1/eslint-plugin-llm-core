import path from "node:path";
import { realpath, stat } from "node:fs/promises";
import { loadESLint } from "eslint";
import tsParser from "@typescript-eslint/parser";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// ESM importing the CJS plugin's ./instructions subpath via interop.
import { getRuleInstruction } from "eslint-plugin-llm-core/instructions";
// Default export = the plugin object; plugin.rules[name].defaultOptions is the
// public source of a rule's defaults, merged in so option-template placeholders
// resolve even when a project enables a rule without explicit options.
import plugin from "eslint-plugin-llm-core";
import { countSourceFiles } from "./lint-file-limits.js";
import {
  NO_CONFIG_MESSAGE,
  outsideRootResponse,
} from "./lint-file-responses.js";

const LLM_CORE_PREFIX = "llm-core/";

// Default directory-lint cap (Assumption A1); validated/tuned by sub-task 3.7.
const DEFAULT_MAX_FILES = 200;

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

interface RuleModuleWithDefaults {
  defaultOptions?: readonly unknown[];
}

function isRuleModuleMap(
  value: unknown,
): value is Record<string, RuleModuleWithDefaults> {
  return isPlainObject(value);
}

function getCoreRules(value: unknown): Record<string, RuleModuleWithDefaults> {
  return isPlainObject(value) && isRuleModuleMap(value.rules)
    ? value.rules
    : {};
}

const coreRules = getCoreRules(plugin);

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
  /**
   * Enables a transient zero-config fallback when no project ESLint config is
   * discoverable. Disabled by default so v1 project-config behavior remains the
   * default contract.
   */
  fallbackEnabled?: boolean;
}

interface LintViolation {
  ruleId: string;
  line: number;
  column: number;
  severity: number;
  message: string;
  instruction: string | undefined;
  source: LintSource;
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
  overrideConfigFile?: true;
  overrideConfig?: FlatConfig[];
}) => FlatESLintInstance;

type LintSource = "project-config" | "fallback";

type FlatConfig = object;

const inputSchema = {
  path: z
    .string()
    .describe("Path to a file or directory to lint, within the project root"),
};

async function newFlatESLint(
  opts: { cwd: string } & Record<string, unknown>,
): Promise<FlatESLintInstance> {
  // ESLint's exported types do not surface the flat-config overload; the cast
  // matches the runtime shape (mirrors src/instructions/config-resolver.ts).
  const loadFlatESLint = loadESLint as (options: {
    useFlatConfig: boolean;
  }) => Promise<FlatESLintConstructor>;
  const ESLint = await loadFlatESLint({ useFlatConfig: true });
  return new ESLint(opts);
}

async function createFlatESLint(cwd: string): Promise<FlatESLintInstance> {
  return newFlatESLint({ cwd });
}

async function createFallbackESLint(cwd: string): Promise<FlatESLintInstance> {
  return newFlatESLint({
    cwd,
    overrideConfigFile: true,
    overrideConfig: createFallbackConfig(),
  });
}

function createFallbackConfig(): FlatConfig[] {
  const configs =
    isPlainObject(plugin) && isPlainObject(plugin.configs)
      ? plugin.configs
      : {};
  const recommended = Array.isArray(configs.recommended)
    ? configs.recommended
    : [];
  const recommendedRules = (
    recommended[0] as { rules?: Record<string, unknown> } | undefined
  )?.rules;

  return [
    {
      ignores: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/coverage/**",
      ],
    },
    {
      files: ["**/*.ts", "**/*.tsx"],
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          ecmaVersion: "latest",
          sourceType: "module",
        },
      },
    },
    {
      files: ["**/*.js", "**/*.mjs"],
      languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    {
      files: ["**/*.jsx"],
      plugins: { "llm-core": plugin },
      rules: recommendedRules,
      languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        parserOptions: {
          ecmaFeatures: { jsx: true },
        },
      },
    },
    {
      files: ["**/*.cjs"],
      languageOptions: {
        ecmaVersion: "latest",
        sourceType: "commonjs",
      },
    },
    ...recommended,
  ];
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
  source: LintSource,
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
        source,
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
  const fallbackEnabled = options.fallbackEnabled === true;

  server.registerTool(
    "lint_file",
    {
      title: "Lint a File for llm-core Violations",
      description:
        "Lints a file (or directory) with the project's own ESLint config, " +
        "or the opt-in read-only fallback when no config is found, and returns " +
        "each eslint-plugin-llm-core violation with its what/why/how-to-fix " +
        "instruction attached. Call after editing a file to self-correct.",
      inputSchema,
    },
    async ({ path: targetPath }) => {
      const absoluteTarget = path.resolve(projectRoot, targetPath);
      const realProjectRoot = await realpath(projectRoot).catch(
        () => projectRoot,
      );

      if (!isWithinRoot(absoluteTarget, projectRoot)) {
        return outsideRootResponse(targetPath, projectRoot);
      }

      const targetStat = await stat(absoluteTarget).catch(() => null);
      const realTarget = targetStat
        ? await realpath(absoluteTarget).catch(() => absoluteTarget)
        : absoluteTarget;

      if (targetStat && !isWithinRoot(realTarget, realProjectRoot)) {
        return outsideRootResponse(targetPath, projectRoot);
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
          if (fallbackEnabled) {
            const fallbackEslint = await createFallbackESLint(projectRoot);
            const fallbackResults = await fallbackEslint.lintFiles([
              absoluteTarget,
            ]);
            const source = "fallback";
            const violations = await toViolations(
              fallbackResults,
              fallbackEslint,
              source,
            );

            return {
              structuredContent: {
                source,
                violationCount: violations.length,
                violations,
              },
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(violations, null, 2),
                },
              ],
            };
          }

          return {
            content: [{ type: "text" as const, text: NO_CONFIG_MESSAGE }],
          };
        }
        throw error;
      }

      const source = "project-config";
      const violations = await toViolations(results, eslint, source);

      return {
        structuredContent: {
          source,
          violationCount: violations.length,
          violations,
        },
        content: [
          { type: "text" as const, text: JSON.stringify(violations, null, 2) },
        ],
      };
    },
  );
}
