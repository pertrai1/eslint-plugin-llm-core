import path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const calculateConfigForFile = vi.hoisted(() => vi.fn());
const ESLintConstructor = vi.hoisted(() => vi.fn());
const loadESLint = vi.hoisted(() => vi.fn());

type RuleConfigMap = Record<string, unknown>;

function mockVirtualFileConfigs(configs: {
  js?: RuleConfigMap;
  jsx?: RuleConfigMap;
  mjs?: RuleConfigMap;
  cjs?: RuleConfigMap;
  ts?: RuleConfigMap;
  tsx?: RuleConfigMap;
}): void {
  calculateConfigForFile.mockImplementation(async (filePath: string) => {
    const extension = path.extname(filePath).slice(1) as keyof typeof configs;

    return {
      rules: configs[extension] ?? {},
    };
  });
}

vi.mock("eslint", () => ({
  loadESLint,
}));

describe("resolveActiveRules", () => {
  beforeEach(() => {
    vi.resetModules();
    calculateConfigForFile.mockReset();
    ESLintConstructor.mockReset();
    loadESLint.mockReset();

    ESLintConstructor.mockImplementation(function MockESLint() {
      return {
        calculateConfigForFile,
      };
    });

    loadESLint.mockResolvedValue(ESLintConstructor);
  });

  it("resolves active rules from JavaScript and TypeScript configs", async () => {
    mockVirtualFileConfigs({
      js: {
        "llm-core/bad-min-max-func": "error",
        "llm-core/bad-comparison-sequence": "error",
        "llm-core/max-function-length": ["error", { max: 40 }],
        "llm-core/no-unsafe-array-access": "error",
        "llm-core/no-weak-randomness-for-secrets": "error",
        "llm-core/explicit-export-types": "off",
      },
      ts: {
        "llm-core/max-function-length": ["warn", { max: 40 }],
        "llm-core/explicit-export-types": "error",
      },
    });

    const { resolveActiveRules } =
      await import("../../src/instructions/config-resolver");

    await expect(resolveActiveRules("/tmp/eslint.config.mjs")).resolves.toEqual(
      [
        {
          name: "bad-comparison-sequence",
          instruction:
            "Do not write chained comparisons like 0 <= value <= 1; split range checks with &&",
          scope: "all",
        },
        {
          name: "bad-min-max-func",
          instruction:
            "When clamping with Math.min/Math.max, keep the lower bound in Math.max and the upper bound in Math.min",
          scope: "all",
        },
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
        {
          name: "no-unsafe-array-access",
          instruction:
            "Check array length before reading the first or last element, or make the undefined fallback explicit",
          scope: "all",
        },
        {
          name: "no-weak-randomness-for-secrets",
          instruction:
            "Use cryptographic randomness for tokens, secrets, sessions, nonces, salts, reset codes, API keys, and credentials",
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
      path.join(process.cwd(), "__virtual__.jsx"),
    );
    expect(calculateConfigForFile).toHaveBeenNthCalledWith(
      3,
      path.join(process.cwd(), "__virtual__.mjs"),
    );
    expect(calculateConfigForFile).toHaveBeenNthCalledWith(
      4,
      path.join(process.cwd(), "__virtual__.cjs"),
    );
    expect(calculateConfigForFile).toHaveBeenNthCalledWith(
      5,
      path.join(process.cwd(), "__virtual__.ts"),
    );
    expect(calculateConfigForFile).toHaveBeenNthCalledWith(
      6,
      path.join(process.cwd(), "__virtual__.tsx"),
    );
  });

  it("excludes rules that are turned off", async () => {
    mockVirtualFileConfigs({
      js: {
        "llm-core/max-function-length": "off",
      },
      ts: {
        "llm-core/max-function-length": "off",
      },
    });

    const { resolveActiveRules } =
      await import("../../src/instructions/config-resolver");

    await expect(resolveActiveRules()).resolves.toEqual([]);
  });

  it("treats rules enabled only for JavaScript files as applying to all files", async () => {
    mockVirtualFileConfigs({
      js: {
        "llm-core/no-empty-catch": "warn",
      },
    });

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
    mockVirtualFileConfigs({
      js: {
        "llm-core/max-params": [
          "error",
          { max: 3, maxConstructor: 5, maxInternal: 4 },
        ],
        "llm-core/no-magic-numbers": ["warn", { ignore: [5, 10] }],
      },
    });

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

  it("emits separate JavaScript and TypeScript instructions when shared rule options differ", async () => {
    mockVirtualFileConfigs({
      js: {
        "llm-core/max-function-length": ["error", { max: 50 }],
      },
      ts: {
        "llm-core/max-function-length": ["error", { max: 30 }],
      },
    });

    const { resolveActiveRules } =
      await import("../../src/instructions/config-resolver");

    await expect(resolveActiveRules()).resolves.toEqual([
      {
        name: "max-function-length",
        instruction:
          "Keep functions under 50 lines — extract helpers when they grow",
        scope: "javascript-only",
      },
      {
        name: "max-function-length",
        instruction:
          "Keep functions under 30 lines — extract helpers when they grow",
        scope: "typescript-only",
      },
    ]);
  });

  it("includes rules configured only for TSX files in TypeScript instructions", async () => {
    mockVirtualFileConfigs({
      tsx: {
        "llm-core/explicit-export-types": "error",
      },
    });

    const { resolveActiveRules } =
      await import("../../src/instructions/config-resolver");

    await expect(resolveActiveRules()).resolves.toEqual([
      {
        name: "explicit-export-types",
        instruction:
          "Add explicit parameter and return type annotations on all exported functions",
        scope: "typescript-only",
      },
    ]);

    expect(calculateConfigForFile).toHaveBeenNthCalledWith(
      6,
      path.join(process.cwd(), "__virtual__.tsx"),
    );
  });

  it("includes rules configured only for JSX, MJS, and CJS files in JavaScript instructions", async () => {
    mockVirtualFileConfigs({
      jsx: {
        "llm-core/max-function-length": ["error", { max: 45 }],
      },
      mjs: {
        "llm-core/no-empty-catch": "warn",
      },
      cjs: {
        "llm-core/no-magic-numbers": ["error", { ignore: [0] }],
      },
    });

    const { resolveActiveRules } =
      await import("../../src/instructions/config-resolver");

    await expect(resolveActiveRules()).resolves.toEqual([
      {
        name: "max-function-length",
        instruction:
          "Keep functions under 45 lines — extract helpers when they grow",
        scope: "all",
      },
      {
        name: "no-empty-catch",
        instruction:
          "Never leave catch blocks empty — handle, rethrow, or log the error",
        scope: "all",
      },
      {
        name: "no-magic-numbers",
        instruction: "Extract named constants for magic numbers (ignore: 0)",
        scope: "all",
      },
    ]);

    expect(calculateConfigForFile).toHaveBeenNthCalledWith(
      2,
      path.join(process.cwd(), "__virtual__.jsx"),
    );
    expect(calculateConfigForFile).toHaveBeenNthCalledWith(
      3,
      path.join(process.cwd(), "__virtual__.mjs"),
    );
    expect(calculateConfigForFile).toHaveBeenNthCalledWith(
      4,
      path.join(process.cwd(), "__virtual__.cjs"),
    );
  });
});
