import eslintPlugin from "eslint-plugin-eslint-plugin";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

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
];
