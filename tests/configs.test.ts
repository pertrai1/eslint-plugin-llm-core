import { describe, it, expect } from "vitest";
import plugin from "../src/index";

describe("plugin configs", () => {
  it("exposes a bestPractices alias that equals best-practices", () => {
    expect(plugin.configs.bestPractices).toBeDefined();
    expect(plugin.configs.bestPractices).toEqual(
      plugin.configs["best-practices"],
    );
  });
});
