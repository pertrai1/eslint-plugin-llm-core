import path from "node:path";
import { createJiti } from "jiti";
import eslintPlugin from "eslint-plugin-eslint-plugin";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

// Dogfood: load the plugin from TypeScript source (not dist/) so the
// pre-commit hook and CI both lint against current rule code without
// requiring a build step first.
const jiti = createJiti(import.meta.url);
const llmCore = await jiti.import(
  path.resolve(import.meta.dirname, "src/index.ts"),
);

export default [
  {
    ignores: [
      "dist/",
      "coverage/",
      "node_modules/",
      "evals/",
      // Fixtures contain deliberate rule violations for the MCP lint_file
      // integration tests; the repo linter must not flag them.
      "packages/mcp-server/tests/fixtures/",
      // Transient benchmark projects (also gitignored).
      "packages/mcp-server/benchmarks/tmp-*/",
      // MCP server build output.
      "packages/mcp-server/dist/",
    ],
  },
  ...tseslint.configs.recommended,
  eslintPlugin.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts"],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["vitest.config.ts", "commitlint.config.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...llmCore.configs.recommended,

  // ── Rule implementation files ──────────────────────────────────────
  // Rule files export `instruction` by convention alongside a default
  // createRule() export. The metrics rules are tuned for consumer code,
  // not for AST visitor logic that is inherently complex/long.
  {
    files: ["src/rules/**/*.ts"],
    rules: {
      "llm-core/filename-match-export": "off",
      "llm-core/no-magic-numbers": "off",
      "llm-core/no-llm-artifacts": "off",
      "llm-core/no-commented-out-code": "off",
      "llm-core/max-function-length": ["error", { max: 250 }],
      "llm-core/max-complexity": ["error", { max: 25 }],
      "llm-core/max-nesting-depth": ["error", { max: 6 }],
      "llm-core/max-params": ["error", { max: 4 }],
      "llm-core/max-file-length": ["error", { max: 500 }],
    },
  },

  // ── Instruction modules ────────────────────────────────────────────
  // Same `instruction` export convention as rule files.
  {
    files: ["src/instructions/**/*.ts"],
    rules: {
      "llm-core/filename-match-export": "off",
      "llm-core/max-params": ["error", { max: 4 }],
    },
  },

  // ── Test fixtures ──────────────────────────────────────────────────
  // Fixtures contain intentional bad examples for rule tests.
  {
    files: ["tests/fixtures/**/*.{ts,js,mjs}"],
    rules: {
      "llm-core/filename-match-export": "off",
      "llm-core/no-exported-function-expressions": "off",
      "llm-core/explicit-export-types": "off",
      "llm-core/no-magic-numbers": "off",
    },
  },

  // ── Test files ─────────────────────────────────────────────────────
  // Test files contain bad patterns as test cases and use callbacks with
  // extra parameters.
  {
    files: ["tests/**/*.test.ts"],
    rules: {
      "llm-core/no-inline-disable": "off",
      "llm-core/no-llm-artifacts": "off",
      "llm-core/no-commented-out-code": "off",
      "llm-core/max-params": ["error", { max: 4 }],
    },
  },

  // ── Config files ───────────────────────────────────────────────────
  // Config files use numeric thresholds that are self-documenting.
  {
    files: ["vitest.config.ts", "*.config.mjs", "tests/fixtures/*.config.mjs"],
    rules: {
      "llm-core/no-magic-numbers": "off",
    },
  },

  // ── Benchmark scripts ──────────────────────────────────────────────
  // Benchmarks use numeric sizes and dynamic logging by nature.
  {
    files: ["packages/mcp-server/benchmarks/**/*.{ts,js,mjs}"],
    rules: {
      "llm-core/no-magic-numbers": "off",
      "llm-core/structured-logging": "off",
    },
  },

  // ── MCP server package ─────────────────────────────────────────────
  // The MCP server tool implementations are naturally more complex than
  // consumer code. Raise thresholds modestly for this package.
  // filename-match-export is off because resource/tool modules use a
  // registration pattern (export function registerXxx) that doesn't
  // match the filename.
  {
    files: ["packages/mcp-server/src/**/*.ts"],
    rules: {
      "llm-core/filename-match-export": "off",
      "llm-core/max-function-length": ["error", { max: 100 }],
      "llm-core/max-nesting-depth": ["error", { max: 5 }],
      "llm-core/max-file-length": ["error", { max: 400 }],
    },
  },
];
