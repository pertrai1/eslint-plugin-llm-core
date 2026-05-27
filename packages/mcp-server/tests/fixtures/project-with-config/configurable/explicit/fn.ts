// 2 params exceeds the explicitly configured llm-core/max-params (max: 1).
// Used to verify the instruction interpolates explicit option values.
export function twoParams(a: number, b: number): number {
  return a + b;
}
