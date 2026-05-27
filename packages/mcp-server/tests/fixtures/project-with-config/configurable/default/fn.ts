// 3 params exceeds llm-core/max-params default (max: 2).
// Used to verify the instruction interpolates the rule's default options.
export function threeParams(a: number, b: number, c: number): number {
  return a + b + c;
}
