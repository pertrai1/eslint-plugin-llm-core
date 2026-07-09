import { describe, expect, it } from "vitest";
import { getRuleInstruction } from "../../src/instructions";

describe("getRuleInstruction", () => {
  describe("prefix normalization", () => {
    it("resolves a prefixed ruleId to the same result as a bare name", () => {
      const prefixed = getRuleInstruction("llm-core/no-empty-catch");
      const bare = getRuleInstruction("no-empty-catch");

      expect(prefixed).toBeDefined();
      expect(prefixed).toBe(bare);
    });

    it("resolves a bare name without prefix", () => {
      const result = getRuleInstruction("no-empty-catch");

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result!.length).toBeGreaterThan(0);
    });
  });

  describe("unknown rule", () => {
    it("returns undefined for a rule that does not exist", () => {
      expect(getRuleInstruction("not-a-real-rule")).toBeUndefined();
    });

    it("returns undefined for a prefixed rule that does not exist", () => {
      expect(getRuleInstruction("llm-core/not-a-real-rule")).toBeUndefined();
    });
  });

  describe("option interpolation", () => {
    it("interpolates options into a rule with a single placeholder in its principle", () => {
      // max-function-length uses a single {max} placeholder in its principle
      const result = getRuleInstruction("max-function-length", { max: 25 });

      expect(result).toBeDefined();
      expect(result).toContain("25");
      expect(result).not.toMatch(/\{max\}/);
    });

    it("interpolates options for a rule with optionTemplate (max-params)", () => {
      // max-params has optionTemplate with {max} and {maxConstructor}
      const result = getRuleInstruction("max-params", {
        max: 3,
        maxConstructor: 5,
      });

      expect(result).toBeDefined();
      expect(result).toContain("3");
      expect(result).toContain("5");
      expect(result).not.toMatch(/\{max\}/);
      expect(result).not.toMatch(/\{maxConstructor\}/);
    });

    it("returns the principle without placeholder leaks when no options are provided", () => {
      // no-empty-catch has no option placeholders — should return principle as-is
      const result = getRuleInstruction("no-empty-catch");

      expect(result).toBeDefined();
      expect(result).not.toMatch(/\{\w+\}/);
    });

    it("uses defaults when options are omitted for a configurable rule", () => {
      // Calling without options should still return a resolved string (using defaults)
      const withoutOptions = getRuleInstruction("max-function-length");
      const withDefaults = getRuleInstruction("max-function-length", {});

      expect(withoutOptions).toBeDefined();
      expect(withDefaults).toBeDefined();
      // Both calls with no options / empty options should produce the same result
      expect(withoutOptions).toBe(withDefaults);
    });
  });
});
