import path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const calculateConfigForFile = vi.hoisted(() => vi.fn());
const ESLintConstructor = vi.hoisted(() => vi.fn());
const loadESLint = vi.hoisted(() => vi.fn());

vi.mock("eslint", () => ({
  loadESLint,
}));

describe("resolveActiveRules", () => {
  beforeEach(() => {
    vi.resetModules();
    calculateConfigForFile.mockReset();
    ESLintConstructor.mockReset();
    loadESLint.mockReset();

    ESLintConstructor.mockImplementation(() => ({
      calculateConfigForFile,
    }));

    loadESLint.mockResolvedValue(ESLintConstructor);
  });

  it("resolves active rules from JavaScript and TypeScript configs", async () => {
    calculateConfigForFile
      .mockResolvedValueOnce({
        rules: {
          "llm-core/max-function-length": ["error", { max: 40 }],
          "llm-core/explicit-export-types": "off",
        },
      })
      .mockResolvedValueOnce({
        rules: {
          "llm-core/max-function-length": ["warn", { max: 40 }],
          "llm-core/explicit-export-types": "error",
        },
      });

    const { resolveActiveRules } =
      await import("../../src/instructions/config-resolver");

    await expect(resolveActiveRules("/tmp/eslint.config.mjs")).resolves.toEqual(
      [
        {
          name: "explicit-export-types",
          instruction:
            "Add explicit parameter and return type annotations on all exported functions",
          scope: "typescript-only",
        },
        {
          name: "max-function-length",
          instruction:
            "Keep functions under 40 lines — extract helpers when they grow",
          scope: "all",
        },
      ],
    );

    expect(loadESLint).toHaveBeenCalledWith({ useFlatConfig: true });
    expect(ESLintConstructor).toHaveBeenCalledWith({
      overrideConfigFile: "/tmp/eslint.config.mjs",
    });
    expect(calculateConfigForFile).toHaveBeenNthCalledWith(
      1,
      path.join(process.cwd(), "__virtual__.js"),
    );
    expect(calculateConfigForFile).toHaveBeenNthCalledWith(
      2,
      path.join(process.cwd(), "__virtual__.ts"),
    );
  });

  it("excludes rules that are turned off", async () => {
    calculateConfigForFile
      .mockResolvedValueOnce({
        rules: {
          "llm-core/max-function-length": "off",
        },
      })
      .mockResolvedValueOnce({
        rules: {
          "llm-core/max-function-length": "off",
        },
      });

    const { resolveActiveRules } =
      await import("../../src/instructions/config-resolver");

    await expect(resolveActiveRules()).resolves.toEqual([]);
  });

  it("treats rules enabled only for JavaScript files as applying to all files", async () => {
    calculateConfigForFile
      .mockResolvedValueOnce({
        rules: {
          "llm-core/no-empty-catch": "warn",
        },
      })
      .mockResolvedValueOnce({ rules: {} });

    const { resolveActiveRules } =
      await import("../../src/instructions/config-resolver");

    await expect(resolveActiveRules()).resolves.toEqual([
      {
        name: "no-empty-catch",
        instruction:
          "Never leave catch blocks empty — handle, rethrow, or log the error",
        scope: "all",
      },
    ]);
  });

  it("interpolates option values from resolved rule configuration", async () => {
    calculateConfigForFile
      .mockResolvedValueOnce({
        rules: {
          "llm-core/max-params": [
            "error",
            { max: 3, maxConstructor: 5, maxInternal: 4 },
          ],
          "llm-core/no-magic-numbers": ["warn", { ignore: [5, 10] }],
        },
      })
      .mockResolvedValueOnce({ rules: {} });

    const { resolveActiveRules } =
      await import("../../src/instructions/config-resolver");

    await expect(resolveActiveRules()).resolves.toEqual([
      {
        name: "max-params",
        instruction:
          "Limit function parameters to 3 (constructors: 5) — use object parameter patterns",
        scope: "all",
      },
      {
        name: "no-magic-numbers",
        instruction:
          "Extract named constants for magic numbers (ignore: 5, 10)",
        scope: "all",
      },
    ]);
  });
});
