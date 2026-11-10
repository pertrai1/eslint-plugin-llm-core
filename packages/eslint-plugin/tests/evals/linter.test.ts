import { describe, expect, it } from "vitest";
import { lintCode, normalizeRuleFilter } from "../../../../evals/src/linter";

describe("eval rule selection", () => {
  it("normalizes repeated selections into sorted unique short names", () => {
    expect(
      normalizeRuleFilter([
        "structured-logging",
        "no-magic-numbers",
        "structured-logging",
      ]),
    ).toEqual(["no-magic-numbers", "structured-logging"]);
  });
});

it.each([
  "unknown-rule",
  "llm-core/no-magic-numbers",
  "no-magic-numbers,structured-logging",
  "",
  "No-Magic-Numbers",
  "toString",
  "__esModule",
])("rejects invalid selection %j even alongside a valid rule", (name) => {
  expect(() => normalizeRuleFilter(["no-magic-numbers", name])).toThrow(
    /Invalid rule.*Use exact short names/,
  );
});

it("isolates selected rules across successive calls", () => {
  const code = "let x = y * 100; console.log(`User ${userId} logged in`);";
  const original = lintCode(code);
  expect(original.map((v) => v.ruleId)).toContain("llm-core/no-magic-numbers");
  expect(original.map((v) => v.ruleId)).toContain(
    "llm-core/structured-logging",
  );
  expect(lintCode(code, ["no-magic-numbers"])).toEqual(
    original.filter((v) => v.ruleId === "llm-core/no-magic-numbers"),
  );
  expect(lintCode(code, ["structured-logging"])).toEqual(
    original.filter((v) => v.ruleId === "llm-core/structured-logging"),
  );
  expect(lintCode(code)).toEqual(original);
  expect(lintCode(code, [])).toEqual(original);
});

it("treats absent and empty selections as all rules", () => {
  expect(normalizeRuleFilter()).toEqual([]);
  expect(normalizeRuleFilter([])).toEqual([]);
  expect(lintCode("", ["no-magic-numbers"])).toEqual([]);
});

it("rejects programmatic invalid filters before linting", () => {
  expect(() => lintCode("", ["no-magic-numbers", "unknown-rule"])).toThrow(
    'Invalid rule "unknown-rule"',
  );
});

it("enables the union once regardless of filter order", () => {
  const code = "let x = y * 100; console.log(`User ${userId} logged in`);";
  const result = lintCode(code, [
    "structured-logging",
    "no-magic-numbers",
    "structured-logging",
  ]);
  expect(result.map((v) => v.ruleId)).toEqual([
    "llm-core/no-magic-numbers",
    "llm-core/structured-logging",
  ]);
  expect(lintCode(code, ["no-magic-numbers", "structured-logging"])).toEqual(
    result,
  );
});
