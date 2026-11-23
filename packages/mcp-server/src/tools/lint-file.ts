import path from "node:path";
import { readdir, realpath, stat } from "node:fs/promises";
import { loadESLint } from "eslint";
import tsParser from "@typescript-eslint/parser";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import plugin from "eslint-plugin-llm-core";
import {
  getConfiguredRuleInstruction,
  isEnabledRuleConfig,
  LLM_CORE_PREFIX,
} from "./rule-guidance.js";

const MAX_SUGGESTIONS_PER_VIOLATION = 3;
const MAX_SUGGESTIONS_PER_REPORT = 20;
const MAX_SUGGESTION_TEXT_LENGTH = 512;

// Default directory-lint cap (Assumption A1); validated/tuned by sub-task 3.7.
const DEFAULT_MAX_FILES = 200;

// Most violations returned by one call. Bounds the result size; the caller
// fixes what is shown and lints again, or narrows the path.
const DEFAULT_MAX_VIOLATIONS = 100;

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
  "lint_file lints using your project's own ESLint config by default. To use",
  "project-config findings, install and configure eslint-plugin-llm-core in",
  "your project:",
  "",
  "  npm install --save-dev eslint eslint-plugin-llm-core",
  "",
  "Then add it to your flat config (eslint.config.js), for example:",
  "",
  '  import llmCore from "eslint-plugin-llm-core";',
  "  export default [...llmCore.configs.recommended];",
  "",
  "Alternatively, start the MCP server with LLM_CORE_MCP_ENABLE_FALLBACK=1 to",
  'enable read-only fallback findings labeled with source: "fallback".',
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
   * Maximum number of violations one call returns. Further violations are
   * counted but omitted. Defaults to {@link DEFAULT_MAX_VIOLATIONS}.
   */
  maxViolations?: number;
  /**
   * Enables a transient zero-config fallback when no project ESLint config is
   * discoverable. Disabled by default so v1 project-config behavior remains the
   * default contract.
   */
  fallbackEnabled?: boolean;
}

interface LintViolation {
  /** Path relative to the project root. */
  filePath: string;
  line: number;
  column: number;
  ruleId: string;
  severity: number;
  /** The first paragraph of the rule message: what is wrong here. */
  message: string;
  /** Key into {@link LintReport.guidance} for the rest of the message. */
  guidanceId?: string;
  instructionId?: string;
  suggestions?: LintSuggestion[];
  omittedSuggestionCount?: number;
}

interface RuleSummary {
  count: number;
  instruction?: string;
}

/**
 * The lint result. Text that repeats across violations is stored once: the
 * per-rule instruction in `rules`, and each distinct why/how text in `guidance`.
 */
interface LintReport {
  rules: Record<string, RuleSummary>;
  guidance: Record<string, string>;
  instructions: Record<string, string>;
  coveredFileCount: number;
  uncoveredFileCount: number;
  unlintedFiles: UnlintedFile[];
  /** The violations returned, at most the configured cap. */
  violations: LintViolation[];
  /** Every violation found, including those omitted by the cap. */
  violationCount: number;
}

interface LintSuggestion {
  desc: string;
  fix: { range: [number, number]; text: string };
}

interface ReportOptions {
  maxViolations: number;
  includeSuggestions: boolean;
}

interface FlatLintMessage {
  ruleId: string | null;
  line?: number;
  column?: number;
  severity: number;
  message: string;
  fatal?: boolean;
  suggestions?: LintSuggestion[];
}

/**
 * A targeted file ESLint returned no rule results for. Reported separately so
 * an empty violations list is never mistaken for "this file is clean".
 */
interface UnlintedFile {
  filePath: string;
  reason: "parse-error" | "ignored";
  message: string;
  line?: number;
  column?: number;
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
  calculateConfigForFile(
    filePath: string,
  ): Promise<ResolvedFileConfig | undefined>;
}

type FlatESLintConstructor = new (options?: {
  cwd?: string;
  overrideConfigFile?: true;
  overrideConfig?: FlatConfig[];
}) => FlatESLintInstance;

type LintSource = "project-config" | "fallback";

type FlatConfig = Record<string, unknown>;

const inputSchema = {
  path: z
    .string()
    .describe("Path to a file or directory to lint, within the project root"),
  includeSuggestions: z
    .boolean()
    .optional()
    .describe("Return bounded, advisory ESLint suggestions; never edits files"),
};

const outputSchema = {
  source: z
    .enum(["project-config", "fallback"])
    .describe("Which ESLint configuration produced the result"),
  violationCount: z.number().int(),
  violations: z.array(
    z.object({
      filePath: z.string().describe("Path relative to the project root"),
      line: z.number().int(),
      column: z.number().int(),
      ruleId: z.string(),
      severity: z.number().int(),
      message: z.string().describe("What is wrong at this location"),
      instructionId: z
        .string()
        .optional()
        .describe(
          "Resolve from instructions instead of rules[ruleId].instruction",
        ),
      suggestions: z
        .array(
          z.object({
            desc: z.string().max(MAX_SUGGESTION_TEXT_LENGTH),
            fix: z.object({
              range: z.tuple([
                z.number().int().nonnegative(),
                z.number().int().nonnegative(),
              ]),
              text: z.string().max(MAX_SUGGESTION_TEXT_LENGTH),
            }),
          }),
        )
        .max(MAX_SUGGESTIONS_PER_VIOLATION)
        .optional()
        .describe(
          "Advisory only. Ranges are zero-based UTF-16 with an exclusive end.",
        ),
      omittedSuggestionCount: z.number().int().positive().optional(),
      guidanceId: z
        .string()
        .optional()
        .describe("Key into `guidance` for the why and how-to-fix text"),
    }),
  ),
  rules: z
    .record(
      z.string(),
      z.object({
        count: z.number().int(),
        instruction: z.string().optional(),
      }),
    )
    .describe("One entry per rule that fired, keyed by rule id"),
  guidance: z
    .record(z.string(), z.string())
    .describe("Why and how-to-fix text, shared by the violations that cite it"),
  instructions: z
    .record(z.string(), z.string())
    .optional()
    .describe(
      "Shared per-file instruction overrides, referenced by instructionId",
    ),
  coveredFileCount: z
    .number()
    .int()
    .nonnegative()
    .describe(
      "Linted files with llm-core rules enabled or an llm-core finding",
    ),
  uncoveredFileCount: z
    .number()
    .int()
    .nonnegative()
    .describe(
      "Linted files with no enabled llm-core rules; not a clean result",
    ),
  omittedViolationCount: z
    .number()
    .int()
    .describe("Violations found but left out of `violations` by the cap"),
  unlintedFileCount: z.number().int(),
  unlintedFiles: z.array(
    z.object({
      filePath: z.string(),
      reason: z.enum(["parse-error", "ignored"]),
      message: z.string(),
      line: z.number().int().optional(),
      column: z.number().int().optional(),
    }),
  ),
};

async function newFlatESLint(
  opts: { cwd: string } & Record<string, unknown>,
): Promise<FlatESLintInstance> {
  // ESLint's exported types do not surface the flat-config overload; the cast
  // matches the runtime shape (mirrors src/instructions/config-resolver.ts).
  const loadFlatESLint = loadESLint as unknown as (options: {
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
  const llmPlugin = plugin as unknown as {
    configs: Record<string, FlatConfig[]>;
  };
  const recommended = llmPlugin.configs.recommended ?? [];
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

/**
 * Splits a rule message at its first blank line: the first paragraph says what
 * is wrong at this location, and the rest is the why and how-to-fix text.
 */
export function splitRuleMessage(text: string): {
  message: string;
  guidance: string | undefined;
} {
  const boundary = text.indexOf("\n\n");

  if (boundary === -1) {
    return { message: text, guidance: undefined };
  }

  return {
    message: text.slice(0, boundary),
    guidance: text.slice(boundary + 2),
  };
}

/** Intern identical text for one rule without repeating it in the payload. */
function internRuleText(
  ruleId: string,
  value: string,
  idsByRule: Map<string, Map<string, string>>,
  table: Record<string, string>,
): string {
  const ids = idsByRule.get(ruleId) ?? new Map<string, string>();
  idsByRule.set(ruleId, ids);

  const existing = ids.get(value);
  if (existing) {
    return existing;
  }

  const id = `${ruleId}#${ids.size + 1}`;
  ids.set(value, id);
  table[id] = value;
  return id;
}

function selectSuggestions(
  candidates: LintSuggestion[],
  remaining: number,
): LintSuggestion[] {
  return candidates
    .filter(
      ({ desc, fix }) =>
        desc.length <= MAX_SUGGESTION_TEXT_LENGTH &&
        fix.text.length <= MAX_SUGGESTION_TEXT_LENGTH,
    )
    .slice(0, Math.min(remaining, MAX_SUGGESTIONS_PER_VIOLATION))
    .map(({ desc, fix: { range, text } }) => ({ desc, fix: { range, text } }));
}

function hasEnabledLlmCoreRule(rules: Record<string, unknown>): boolean {
  return Object.entries(rules).some(
    ([ruleId, entry]) =>
      ruleId.startsWith(LLM_CORE_PREFIX) && isEnabledRuleConfig(entry),
  );
}

async function toLintReport(
  results: FlatLintResult[],
  eslint: FlatESLintInstance,
  projectRoot: string,
  options: ReportOptions,
): Promise<LintReport> {
  const report: LintReport = {
    rules: {},
    guidance: {},
    instructions: {},
    violations: [],
    violationCount: 0,
    coveredFileCount: 0,
    uncoveredFileCount: 0,
    unlintedFiles: [],
  };
  const guidanceIds = new Map<string, Map<string, string>>();
  const instructionIds = new Map<string, Map<string, string>>();
  let remainingSuggestions = MAX_SUGGESTIONS_PER_REPORT;

  for (const result of results) {
    const filePath = path.relative(projectRoot, result.filePath);
    const unlintedFile = getUnlintedFile(result, filePath);
    if (unlintedFile) {
      report.unlintedFiles.push(unlintedFile);
      continue;
    }

    const fileRules =
      (await eslint.calculateConfigForFile(result.filePath))?.rules ?? {};
    const hasLlmCoreFinding = result.messages.some((message) =>
      message.ruleId?.startsWith(LLM_CORE_PREFIX),
    );
    // A finding is also evidence of coverage, even when enabled inline.
    if (hasLlmCoreFinding || hasEnabledLlmCoreRule(fileRules)) {
      report.coveredFileCount += 1;
    } else {
      report.uncoveredFileCount += 1;
    }

    const instructionsForFile = new Map<string, string | undefined>();
    for (const lintMessage of result.messages) {
      const ruleId = lintMessage.ruleId;
      if (!ruleId || !ruleId.startsWith(LLM_CORE_PREFIX)) {
        continue;
      }

      if (!instructionsForFile.has(ruleId)) {
        instructionsForFile.set(
          ruleId,
          getConfiguredRuleInstruction(ruleId, fileRules[ruleId]),
        );
      }
      const instruction = instructionsForFile.get(ruleId);
      const rule = (report.rules[ruleId] ??= { count: 0, instruction });
      rule.count += 1;
      report.violationCount += 1;
      if (report.violations.length >= options.maxViolations) {
        continue;
      }

      const { message, guidance } = splitRuleMessage(lintMessage.message);
      const violation: LintViolation = {
        filePath,
        line: lintMessage.line ?? 0,
        column: lintMessage.column ?? 0,
        ruleId,
        severity: lintMessage.severity,
        message,
      };
      if (guidance !== undefined) {
        violation.guidanceId = internRuleText(
          ruleId,
          guidance,
          guidanceIds,
          report.guidance,
        );
      }
      if (instruction !== undefined && instruction !== rule.instruction) {
        violation.instructionId = internRuleText(
          ruleId,
          instruction,
          instructionIds,
          report.instructions,
        );
      }
      if (options.includeSuggestions && lintMessage.suggestions?.length) {
        const suggestions = selectSuggestions(
          lintMessage.suggestions,
          remainingSuggestions,
        );
        remainingSuggestions -= suggestions.length;
        const omitted = lintMessage.suggestions.length - suggestions.length;
        if (suggestions.length > 0) violation.suggestions = suggestions;
        if (omitted > 0) violation.omittedSuggestionCount = omitted;
      }

      report.violations.push(violation);
    }
  }

  return report;
}

const IGNORED_FILE_MESSAGE = /^File ignored/;

/** Preserve files that produced no rule results, separately from coverage. */
function getUnlintedFile(
  result: FlatLintResult,
  filePath: string,
): UnlintedFile | undefined {
  const fatal = result.messages.find((message) => message.fatal === true);
  if (fatal) {
    return {
      filePath,
      reason: "parse-error",
      message: fatal.message,
      line: fatal.line,
      column: fatal.column,
    };
  }

  const ignored = result.messages.find(
    (message) =>
      message.ruleId === null && IGNORED_FILE_MESSAGE.test(message.message),
  );
  if (ignored) return { filePath, reason: "ignored", message: ignored.message };
}

function describeUnlintedFile(file: UnlintedFile): string {
  if (file.reason === "parse-error") {
    return `- ${file.filePath}:${file.line ?? 0}:${file.column ?? 0} — parse error: ${file.message}`;
  }

  return `- ${file.filePath} — not linted: ${file.message}`;
}

function describeUnlintedFiles(
  unlintedFiles: UnlintedFile[],
  nothingLinted: boolean,
): string {
  const heading = nothingLinted
    ? "No file was linted, so there is no llm-core result for this path. " +
      "This does not mean the code is clean."
    : `${unlintedFiles.length} file(s) were not linted and are not covered by ` +
      "the violations above. This does not mean they are clean.";

  return [heading, "", ...unlintedFiles.map(describeUnlintedFile)].join("\n");
}

async function toToolResult(
  results: FlatLintResult[],
  eslint: FlatESLintInstance,
  source: LintSource,
  projectRoot: string,
  options: ReportOptions,
) {
  const report = await toLintReport(results, eslint, projectRoot, options);
  const omittedViolationCount =
    report.violationCount - report.violations.length;
  const { unlintedFiles } = report;
  const structuredContent = {
    source,
    violationCount: report.violationCount,
    violations: report.violations,
    rules: report.rules,
    guidance: report.guidance,
    ...(Object.keys(report.instructions).length > 0
      ? { instructions: report.instructions }
      : {}),
    coveredFileCount: report.coveredFileCount,
    uncoveredFileCount: report.uncoveredFileCount,
    omittedViolationCount,
    unlintedFileCount: unlintedFiles.length,
    unlintedFiles,
  };
  const nothingLinted =
    unlintedFiles.length > 0 && unlintedFiles.length === results.length;

  if (nothingLinted) {
    return {
      isError: true,
      structuredContent,
      content: [
        {
          type: "text" as const,
          text: describeUnlintedFiles(unlintedFiles, true),
        },
      ],
    };
  }

  const content = [
    { type: "text" as const, text: JSON.stringify(structuredContent) },
  ];
  if (omittedViolationCount > 0) {
    content.push({
      type: "text" as const,
      text:
        `Showing the first ${report.violations.length} of ` +
        `${report.violationCount} violations. Fix these and run lint_file ` +
        "again, or narrow the path to a file or subdirectory to see the rest.",
    });
  }
  if (unlintedFiles.length > 0) {
    content.push({
      type: "text" as const,
      text: describeUnlintedFiles(unlintedFiles, false),
    });
  }

  if (report.uncoveredFileCount > 0) {
    content.push({
      type: "text" as const,
      text:
        `${report.uncoveredFileCount} linted file(s) have no enabled llm-core rules. ` +
        "This does not mean they are clean. Check that the project config enables llm-core for those paths.",
    });
  }

  return { structuredContent, content };
}

export function registerLintFile(
  server: McpServer,
  options: LintFileOptions = {},
): void {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  const maxViolations = options.maxViolations ?? DEFAULT_MAX_VIOLATIONS;
  const fallbackEnabled = options.fallbackEnabled === true;

  server.registerTool(
    "lint_file",
    {
      title: "Lint a File for llm-core Violations",
      description:
        "Lints a file (or directory) with the project's own ESLint config, " +
        "or the opt-in read-only fallback when no config is found, and returns " +
        "each eslint-plugin-llm-core violation with its what/why/how-to-fix " +
        "instruction attached. Call after editing a file to self-correct. " +
        `Read-only. Returns at most ${maxViolations} violations per call; ` +
        "`omittedViolationCount` says how many more there are. Each " +
        "violation gives its file, location and what is wrong; " +
        "`guidance[violation.guidanceId]` holds the why and how-to-fix " +
        "text. For one-line instructions, use `instructions[violation.instructionId]` " +
        "when referenced, otherwise `rules[ruleId].instruction`. Check coverage counts " +
        "before treating zero violations as clean. Use `includeSuggestions` for " +
        "bounded, read-only ESLint suggestions.",
      inputSchema,
      outputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ path: targetPath, includeSuggestions = false }) => {
      const reportOptions = { maxViolations, includeSuggestions };
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
            isError: true,
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

            return toToolResult(
              fallbackResults,
              fallbackEslint,
              "fallback",
              projectRoot,
              reportOptions,
            );
          }

          return {
            isError: true,
            content: [{ type: "text" as const, text: NO_CONFIG_MESSAGE }],
          };
        }
        throw error;
      }

      return toToolResult(
        results,
        eslint,
        "project-config",
        projectRoot,
        reportOptions,
      );
    },
  );
}
