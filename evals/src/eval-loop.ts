import { readFile } from "fs/promises";
import type {
  EvalMode,
  FixtureResult,
  IterationRecord,
  LintViolation,
} from "./types";
import { fixViolations } from "./llm-client";
import { lintCode } from "./linter";
import { stripViolationMessages } from "./strip-messages";

function basename(filePath: string): string {
  return filePath.split("/").pop() ?? filePath;
}

function prepareViolationsForMode(
  violations: LintViolation[],
  mode: EvalMode,
): LintViolation[] {
  return mode === "treatment" ? violations : stripViolationMessages(violations);
}

export async function runFixture(
  fixturePath: string,
  mode: EvalMode,
  options: { model: string; maxIterations: number },
): Promise<FixtureResult> {
  const fixtureName = basename(fixturePath);
  const initialCode = await readFile(fixturePath, "utf-8");

  let currentCode = initialCode;
  let currentViolations = lintCode(currentCode);

  const iterationRecords: IterationRecord[] = [];
  let iterations = 0;

  while (currentViolations.length > 0 && iterations < options.maxIterations) {
    iterations++;
    const violationsBefore = currentViolations.length;

    const violationsForLlm = prepareViolationsForMode(currentViolations, mode);
    const fixedCode = await fixViolations(
      currentCode,
      violationsForLlm,
      options.model,
    );
    const newViolations = lintCode(fixedCode);

    iterationRecords.push({
      iteration: iterations,
      violationsBefore,
      violationsAfter: newViolations.length,
    });

    currentCode = fixedCode;
    currentViolations = newViolations;
  }

  return {
    fixture: fixtureName,
    mode,
    iterations,
    resolved: currentViolations.length === 0,
    iterationRecords,
    finalViolationCount: currentViolations.length,
  };
}
