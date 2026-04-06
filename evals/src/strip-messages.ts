import type { LintViolation } from "./types";

export function stripToFirstLine(message: string): string {
  const doubleNewline = message.indexOf("\n\n");
  if (doubleNewline === -1) {
    return message.split("\n")[0] ?? message;
  }
  return message.slice(0, doubleNewline).split("\n")[0] ?? message;
}

export function stripViolationMessages(
  violations: LintViolation[],
): LintViolation[] {
  return violations.map((v) => ({
    ...v,
    message: stripToFirstLine(v.message),
  }));
}
