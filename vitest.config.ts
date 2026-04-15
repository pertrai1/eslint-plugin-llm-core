import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/index.ts", "src/cli/**", "evals/**"],
      thresholds: {
        statements: 93,
        branches: 85,
        functions: 100,
        lines: 93,
      },
    },
  },
});
