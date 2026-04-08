import type { LintViolation, ViolationDiff } from "./types";

function violationKey(v: LintViolation): string {
  return `${v.ruleId}::${v.line}::${v.column}::${v.message}`;
}

export function computeViolationDiff(
  before: LintViolation[],
  after: LintViolation[],
): ViolationDiff {
  const afterKeys = new Set(after.map(violationKey));
  const beforeKeys = new Set(before.map(violationKey));

  return {
    resolved: before.filter((v) => !afterKeys.has(violationKey(v))),
    persisted: before.filter((v) => afterKeys.has(violationKey(v))),
    introduced: after.filter((v) => !beforeKeys.has(violationKey(v))),
  };
}
