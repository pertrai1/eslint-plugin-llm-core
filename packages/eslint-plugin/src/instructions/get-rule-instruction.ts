import { interpolateInstruction } from "./config-resolver";
import { ruleInstructions } from "./rule-instructions";

/**
 * Returns the interpolated guidance string for a given rule, or `undefined` if
 * the rule has no registered instruction.
 *
 * Accepts either a bare rule name (`no-empty-catch`) or a prefixed rule id
 * (`llm-core/no-empty-catch`) — the prefix is stripped before lookup.
 *
 * @param ruleName - Bare rule name or `llm-core/`-prefixed rule id.
 * @param options  - Resolved options the rule fired with. Used to interpolate
 *                   `{placeholder}` tokens in the instruction template.
 */
export function getRuleInstruction(
  ruleName: string,
  options?: Record<string, unknown>,
): string | undefined {
  const bareName = ruleName.replace(/^llm-core\//, "");
  const instruction = ruleInstructions[bareName];

  if (!instruction) {
    return undefined;
  }

  return interpolateInstruction(instruction, options ?? {});
}
