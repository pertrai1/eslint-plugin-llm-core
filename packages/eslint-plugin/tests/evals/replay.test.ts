import { describe, expect, it } from "vitest";
import { findIterationTrace, type ReplayTarget } from "../../evals/src/replay";
import type { EvalResults } from "../../evals/src/types";

const sampleResults: EvalResults = {
  date: "2026-04-08",
  model: "claude-sonnet-4-20250514",
  pluginVersion: "0.11.1",
  gitCommit: "b2c3d4e",
  results: [
    {
      fixture: "api-service.ts",
      mode: "treatment",
      iterations: 2,
      resolved: true,
      finalViolationCount: 0,
      iterationRecords: [
        {
          iteration: 1,
          violationsBefore: 5,
          violationsAfter: 2,
          promptSent: "Fix these 5 violations...",
          llmResponse: "<reasoning>Adding types</reasoning>\ncode here",
        },
        {
          iteration: 2,
          violationsBefore: 2,
          violationsAfter: 0,
          promptSent: "Fix these 2 violations...",
          llmResponse: "<reasoning>Fixing remaining</reasoning>\nmore code",
        },
      ],
    },
    {
      fixture: "api-service.ts",
      mode: "control",
      iterations: 3,
      resolved: false,
      finalViolationCount: 1,
      iterationRecords: [
        {
          iteration: 1,
          violationsBefore: 5,
          violationsAfter: 3,
          promptSent: "Fix these 5 violations (control)...",
          llmResponse: "control code here",
        },
        {
          iteration: 2,
          violationsBefore: 3,
          violationsAfter: 1,
          promptSent: "Fix these 3 violations (control)...",
          llmResponse: "control code 2",
        },
        {
          iteration: 3,
          violationsBefore: 1,
          violationsAfter: 1,
          promptSent: "Fix this 1 violation (control)...",
          llmResponse: "control code 3",
        },
      ],
    },
  ],
};

describe("findIterationTrace", () => {
  it("finds the correct iteration record for a replay target", () => {
    const target: ReplayTarget = {
      fixture: "api-service.ts",
      mode: "treatment",
      iteration: 2,
    };

    const trace = findIterationTrace(sampleResults, target);

    expect(trace).not.toBeNull();
    expect(trace!.promptSent).toBe("Fix these 2 violations...");
  });

  it("returns null when the fixture/mode combination is not found", () => {
    const target: ReplayTarget = {
      fixture: "missing.ts",
      mode: "treatment",
      iteration: 1,
    };

    expect(findIterationTrace(sampleResults, target)).toBeNull();
  });

  it("returns null when the iteration number does not exist", () => {
    const target: ReplayTarget = {
      fixture: "api-service.ts",
      mode: "treatment",
      iteration: 5,
    };

    expect(findIterationTrace(sampleResults, target)).toBeNull();
  });

  it("returns null when promptSent is missing from the trace", () => {
    const resultsNoTrace: EvalResults = {
      ...sampleResults,
      results: [
        {
          fixture: "api-service.ts",
          mode: "treatment",
          iterations: 1,
          resolved: true,
          finalViolationCount: 0,
          iterationRecords: [
            {
              iteration: 1,
              violationsBefore: 5,
              violationsAfter: 0,
            },
          ],
        },
      ],
    };

    const target: ReplayTarget = {
      fixture: "api-service.ts",
      mode: "treatment",
      iteration: 1,
    };

    expect(findIterationTrace(resultsNoTrace, target)).toBeNull();
  });
});
