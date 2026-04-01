import eslintPlugin from "eslint-plugin-eslint-plugin";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist/", "coverage/", "node_modules/"],
  },
  ...tseslint.configs.recommended,
  eslintPlugin.configs["flat/recommended"],
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
