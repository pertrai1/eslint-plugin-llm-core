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
});
