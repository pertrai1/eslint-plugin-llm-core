import type { FailurePatterns, IterationRecord } from "./types";

export function detectPatterns(records: IterationRecord[]): FailurePatterns {
  return {
    stuckRules: findStuckRules(records),
    oscillatingRules: findOscillatingRules(records),
    cascadingErrors: records.some(
      (r) => r.violationDiff && r.violationDiff.introduced.length > 0,
    ),
  };
}

function findOscillatingRules(records: IterationRecord[]): string[] {
  if (records.length < 3) return [];

  const oscillating = new Set<string>();

  for (let i = 1; i < records.length; i++) {
    const prev = new Set(records[i - 1]?.remainingRuleIds ?? []);
    const curr = new Set(records[i]?.remainingRuleIds ?? []);

    for (const ruleId of curr) {
      if (prev.has(ruleId)) continue;
      // Rule appeared in curr but wasn't in prev — check if it was in an earlier iteration
      const appearedBefore = records
        .slice(0, i - 1)
        .some((r) => r.remainingRuleIds?.includes(ruleId));
      if (appearedBefore) {
        oscillating.add(ruleId);
      }
    }
  }

  return [...oscillating].sort((a, b) => a.localeCompare(b));
}

function findStuckRules(records: IterationRecord[]): string[] {
  if (records.length < 2) return [];

  const last = records[records.length - 1];
  if (!last?.remainingRuleIds?.length) return [];

  return last.remainingRuleIds.filter((ruleId) =>
    records.slice(0, -1).every((r) => r.remainingRuleIds?.includes(ruleId)),
  );
}
