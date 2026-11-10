import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fixViolations } from "../../../../evals/src/llm-client";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  runFixture,
  collectExportedSymbolNames,
  preservesExportedApi,
} from "../../../../evals/src/eval-loop";

describe("eval fixture API preservation", () => {
  it("collects exported symbol names from function and const exports", () => {
    const code = [
      "export const buildClient = () => {};",
      "export async function fetchUser(): Promise<void> {}",
      "const hidden = () => {};",
    ].join("\n");

    expect(collectExportedSymbolNames(code)).toEqual([
      "buildClient",
      "fetchUser",
    ]);
  });

  it("skips re-exported names from other modules", () => {
    const code = [
      'export { buildClient } from "./shared";',
      "export function fetchUser(): void {}",
    ].join("\n");

    expect(collectExportedSymbolNames(code)).toEqual(["fetchUser"]);
  });

  it("requires candidate code to preserve all original exported names", () => {
    const original = [
      "export const buildClient = () => {};",
      "export async function fetchUser(): Promise<void> {}",
    ].join("\n");
    const candidate = "export async function fetchUser(): Promise<void> {}";

    expect(preservesExportedApi(original, candidate)).toBe(false);
  });

  it("accepts candidates that keep the exported api while refactoring internals", () => {
    const original = [
      "export const buildClient = () => {};",
      "export async function fetchUser(): Promise<void> {}",
    ].join("\n");
    const candidate = [
      "export function buildClient(): void {}",
      "export async function fetchUser(): Promise<void> {",
      "  return;",
      "}",
    ].join("\n");

    expect(preservesExportedApi(original, candidate)).toBe(true);
  });
});

vi.mock("../../../../evals/src/llm-client", () => ({ fixViolations: vi.fn() }));
beforeEach(() => vi.mocked(fixViolations).mockReset());

async function fixture(code: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "eval-selection-"));
  const path = join(dir, "mixed.ts");
  await writeFile(path, code);
  return path;
}

it.each(["treatment", "control"] as const)(
  "resolves a fixture clean for selected rules without calling the model in %s",
  async (mode) => {
    const path = await fixture("console.log(`User ${userId} logged in`);");
    const result = await runFixture(path, mode, {
      model: "unused",
      maxIterations: 3,
      ruleFilter: ["no-magic-numbers"],
    });
    expect(result).toMatchObject({
      resolved: true,
      iterations: 0,
      finalViolationCount: 0,
      iterationRecords: [],
    });
    expect(fixViolations).not.toHaveBeenCalled();
  },
);

it.each(["treatment", "control"] as const)(
  "ignores unselected violations after a candidate fix in %s",
  async (mode) => {
    const path = await fixture(
      "let x = y * 100; console.log(`User ${userId} logged in`);",
    );
    vi.mocked(fixViolations).mockResolvedValue({
      code: "const FACTOR = 100; let x = y * FACTOR; console.log(`User ${userId} logged in`);",
      rawResponse: "fixed",
      reasoning: null,
      tokenUsage: { inputTokens: 1, outputTokens: 1 },
      prompt: "saved prompt",
    });
    const result = await runFixture(path, mode, {
      model: "unused",
      maxIterations: 3,
      ruleFilter: ["no-magic-numbers"],
    });
    expect(result).toMatchObject({
      resolved: true,
      iterations: 1,
      finalViolationCount: 0,
      iterationRecords: [
        {
          violationsBefore: 1,
          violationsAfter: 0,
          remainingRuleIds: [],
          violationDiff: {
            resolved: [
              expect.objectContaining({ ruleId: "llm-core/no-magic-numbers" }),
            ],
            persisted: [],
            introduced: [],
          },
        },
      ],
    });
    expect(fixViolations).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fixViolations).mock.calls[0]![1]).toEqual([
      expect.objectContaining({ ruleId: "llm-core/no-magic-numbers" }),
    ]);
    expect(result.patterns).toEqual({
      stuckRules: [],
      oscillatingRules: [],
      cascadingErrors: false,
    });
  },
);

it.each(["treatment", "control"] as const)(
  "stops at the iteration limit for persistent selected violations in %s",
  async (mode) => {
    const code = "let x = y * 100; console.log(`User ${userId} logged in`);";
    const path = await fixture(code);
    vi.mocked(fixViolations).mockResolvedValue({
      code,
      rawResponse: "unchanged",
      reasoning: null,
      tokenUsage: { inputTokens: 1, outputTokens: 1 },
      prompt: "saved prompt",
    });
    const result = await runFixture(path, mode, {
      model: "unused",
      maxIterations: 2,
      ruleFilter: ["no-magic-numbers"],
    });
    expect(result).toMatchObject({
      resolved: false,
      iterations: 2,
      finalViolationCount: 1,
      iterationRecords: [
        {
          violationsBefore: 1,
          violationsAfter: 1,
          remainingRuleIds: ["llm-core/no-magic-numbers"],
        },
        {
          violationsBefore: 1,
          violationsAfter: 1,
          remainingRuleIds: ["llm-core/no-magic-numbers"],
        },
      ],
      patterns: {
        stuckRules: ["llm-core/no-magic-numbers"],
        oscillatingRules: [],
        cascadingErrors: false,
      },
    });
    expect(fixViolations).toHaveBeenCalledTimes(2);
  },
);

it("retains the exported API guard with a filter", async () => {
  const path = await fixture(
    "export function calculate(): number { return 42; }",
  );
  vi.mocked(fixViolations).mockResolvedValue({
    code: "",
    rawResponse: "deleted",
    reasoning: null,
    tokenUsage: { inputTokens: 1, outputTokens: 1 },
    prompt: "saved prompt",
  });
  const result = await runFixture(path, "treatment", {
    model: "unused",
    maxIterations: 1,
    ruleFilter: ["no-magic-numbers"],
  });
  expect(result).toMatchObject({
    resolved: false,
    iterations: 1,
    finalViolationCount: 1,
    iterationRecords: [
      {
        rejectedCandidate: "dropped-exported-api",
        violationsBefore: 1,
        violationsAfter: 1,
        remainingRuleIds: ["llm-core/no-magic-numbers"],
      },
    ],
  });
});
