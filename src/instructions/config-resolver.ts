import type { RuleInstruction } from "./types";

function formatOptionValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}

export function interpolateInstruction(
  instruction: RuleInstruction,
  options: Record<string, unknown>,
): string {
  const template = instruction.optionTemplate ?? instruction.principle;

  return template.replaceAll(/\{(\w+)\}/g, (match, key: string) => {
    if (!(key in options) || options[key] === undefined) {
      return match;
    }

    return formatOptionValue(options[key]);
  });
}
