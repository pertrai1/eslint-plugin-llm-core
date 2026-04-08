import type { EvalMode, EvalResults, IterationRecord } from "./types";

export interface ReplayTarget {
  fixture: string;
  mode: EvalMode;
  iteration: number;
}

export function findIterationTrace(
  results: EvalResults,
  target: ReplayTarget,
): IterationRecord | null {
  const fixtureResult = results.results.find(
    (r) => r.fixture === target.fixture && r.mode === target.mode,
  );

  if (!fixtureResult) return null;

  const record = fixtureResult.iterationRecords.find(
    (r) => r.iteration === target.iteration,
  );

  if (!record || !record.promptSent) return null;

  return record;
}
