import type { EvalResults } from "./types";

export interface RuleAppearance {
  ruleId: string;
  appearances: number;
}

export interface UnresolvedEntry {
  date: string;
  fixture: string;
  mode: string;
  finalViolationCount: number;
}

export interface StuckRuleEntry {
  ruleId: string;
  fixture: string;
  mode: string;
  date: string;
}

export function queryByRule(runs: EvalResults[]): RuleAppearance[] {
  const counts = new Map<string, number>();

  for (const run of runs) {
    for (const result of run.results) {
      for (const record of result.iterationRecords) {
        for (const ruleId of record.remainingRuleIds ?? []) {
          counts.set(ruleId, (counts.get(ruleId) ?? 0) + 1);
        }
      }
    }
  }

  return [...counts.entries()]
    .map(([ruleId, appearances]) => ({ ruleId, appearances }))
    .sort((a, b) => b.appearances - a.appearances);
}

export function queryUnresolved(runs: EvalResults[]): UnresolvedEntry[] {
  const entries: UnresolvedEntry[] = [];

  for (const run of runs) {
    for (const result of run.results) {
      if (!result.resolved) {
        entries.push({
          date: run.date,
          fixture: result.fixture,
          mode: result.mode,
          finalViolationCount: result.finalViolationCount,
        });
      }
    }
  }

  return entries;
}

export function queryStuckRules(runs: EvalResults[]): StuckRuleEntry[] {
  const entries: StuckRuleEntry[] = [];

  for (const run of runs) {
    for (const result of run.results) {
      if (!result.patterns) continue;
      for (const ruleId of result.patterns.stuckRules) {
        entries.push({
          ruleId,
          fixture: result.fixture,
          mode: result.mode,
          date: run.date,
        });
      }
    }
  }

  return entries;
}
