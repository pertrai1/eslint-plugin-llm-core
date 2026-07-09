import { describe, expect, it } from "vitest";
import { computeCodeDiff } from "../../evals/src/code-diff";

describe("computeCodeDiff", () => {
  it("produces a unified diff showing added and removed lines", () => {
    const before = ["export function add(a, b) {", "  return a + b;", "}"].join(
      "\n",
    );

    const after = [
      "export function add(a: number, b: number): number {",
      "  return a + b;",
      "}",
    ].join("\n");

    const diff = computeCodeDiff(before, after);

    expect(diff).toContain("-export function add(a, b) {");
    expect(diff).toContain(
      "+export function add(a: number, b: number): number {",
    );
    expect(diff).not.toContain("-  return a + b;");
  });

  it("handles line insertions without misaligning subsequent lines", () => {
    const before = ["const a = 1;", "const b = 2;", "const c = 3;"].join("\n");

    const after = [
      "import { x } from 'y';",
      "const a = 1;",
      "const b = 2;",
      "const c = 3;",
    ].join("\n");

    const diff = computeCodeDiff(before, after);

    expect(diff).toContain("+import { x } from 'y';");
    expect(diff).toContain(" const a = 1;");
    expect(diff).toContain(" const b = 2;");
    expect(diff).toContain(" const c = 3;");
    expect(diff).not.toContain("-const a = 1;");
  });

  it("returns empty string when code is unchanged", () => {
    const code = "export const x = 1;";

    expect(computeCodeDiff(code, code)).toBe("");
  });
});
