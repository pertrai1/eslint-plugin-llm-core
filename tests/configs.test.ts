import { describe, it, expect } from "vitest";
import plugin from "../src/index";

describe("plugin configs", () => {
  it("exposes a bestPractices alias that equals best-practices", () => {
    expect(plugin.configs.bestPractices).toBeDefined();
    expect(plugin.configs.bestPractices).toEqual(
      plugin.configs["best-practices"],
    );
  });

  it("registers prefer-nullish-coalescing in rule exports and style configs", () => {
    expect(plugin.rules["prefer-nullish-coalescing"]).toBeDefined();

    const styleConfig = plugin.configs.style[0];
    const recommendedConfig = plugin.configs.recommended[0];

    expect(styleConfig.rules?.["llm-core/prefer-nullish-coalescing"]).toBe(
      "error",
    );
    expect(
      recommendedConfig.rules?.["llm-core/prefer-nullish-coalescing"],
    ).toBe("error");
  });

  it("registers missing-throw in rule exports and best-practices configs", () => {
    expect(plugin.rules["missing-throw"]).toBeDefined();

    const bestPracticesConfig = plugin.configs["best-practices"][0];
    const recommendedConfig = plugin.configs.recommended[0];

    expect(bestPracticesConfig.rules?.["llm-core/missing-throw"]).toBe("error");
    expect(recommendedConfig.rules?.["llm-core/missing-throw"]).toBe("error");
  });

  it("registers bad-comparison-sequence in rule exports and best-practices configs", () => {
    expect(plugin.rules["bad-comparison-sequence"]).toBeDefined();

    const bestPracticesConfig = plugin.configs["best-practices"][0];
    const recommendedConfig = plugin.configs.recommended[0];

    expect(
      bestPracticesConfig.rules?.["llm-core/bad-comparison-sequence"],
    ).toBe("error");
    expect(recommendedConfig.rules?.["llm-core/bad-comparison-sequence"]).toBe(
      "error",
    );
  });

  it("registers bad-min-max-func in rule exports and best-practices configs", () => {
    expect(plugin.rules["bad-min-max-func"]).toBeDefined();

    const bestPracticesConfig = plugin.configs["best-practices"][0];
    const recommendedConfig = plugin.configs.recommended[0];

    expect(bestPracticesConfig.rules?.["llm-core/bad-min-max-func"]).toBe(
      "error",
    );
    expect(recommendedConfig.rules?.["llm-core/bad-min-max-func"]).toBe(
      "error",
    );
  });

  it("registers no-hallucinated-local-imports in all config only", () => {
    expect(plugin.rules["no-hallucinated-local-imports"]).toBeDefined();

    const allConfig = plugin.configs.all[0];
    const recommendedConfig = plugin.configs.recommended[0];

    expect(allConfig.rules?.["llm-core/no-hallucinated-local-imports"]).toBe(
      "error",
    );
    expect(
      recommendedConfig.rules?.["llm-core/no-hallucinated-local-imports"],
    ).toBeUndefined();
  });
});
