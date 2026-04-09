import type { LintViolation, ViolationDiff } from "./types";

function violationKey(v: LintViolation): string {
  return `${v.ruleId}::${v.message}`;
}

export function computeViolationDiff(
  before: LintViolation[],
  after: LintViolation[],
): ViolationDiff {
  const afterCounts = new Map<string, number>();
  for (const v of after) {
    const key = violationKey(v);
    afterCounts.set(key, (afterCounts.get(key) ?? 0) + 1);
  }

  const matchedAfter = new Map<string, number>();
  const persisted: LintViolation[] = [];
  const resolved: LintViolation[] = [];

  for (const v of before) {
    const key = violationKey(v);
    const used = matchedAfter.get(key) ?? 0;
    const available = afterCounts.get(key) ?? 0;

    if (used < available) {
      persisted.push(v);
      matchedAfter.set(key, used + 1);
    } else {
      resolved.push(v);
    }
  }

  const beforeCounts = new Map<string, number>();
  for (const v of before) {
    const key = violationKey(v);
    beforeCounts.set(key, (beforeCounts.get(key) ?? 0) + 1);
  }

  const matchedBefore = new Map<string, number>();
  const introduced: LintViolation[] = [];

  for (const v of after) {
    const key = violationKey(v);
    const used = matchedBefore.get(key) ?? 0;
    const available = beforeCounts.get(key) ?? 0;

    if (used < available) {
      matchedBefore.set(key, used + 1);
    } else {
      introduced.push(v);
    }
  }

  return { resolved, persisted, introduced };
}
