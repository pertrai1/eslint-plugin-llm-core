import { AST_NODE_TYPES, TSESLint, TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";
import { isBooleanExpression } from "../../src/utils/is-boolean-expression";

function measureProofs(code: string): {
  messages: TSESLint.Linter.LintMessage[];
  proofs: boolean[];
  firstScopeLookups: number;
  repeatedScopeLookups: number;
} {
  let scopeLookups = 0;
  let firstScopeLookups = 0;
  let repeatedScopeLookups = 0;
  const proofs: boolean[] = [];
  const measuringRule: TSESLint.RuleModule<never, []> = {
    meta: { type: "suggestion", schema: [], messages: {} },
    defaultOptions: [],
    create(context) {
      // Count actual scope lookups while retaining ESLint's real AST and scopes.
      const sourceCode = new Proxy(context.sourceCode, {
        get(target, property) {
          if (property === "getScope") {
            return (node: TSESTree.Node) => {
              scopeLookups++;
              return target.getScope(node);
            };
          }
          return Reflect.get(target, property, target);
        },
      });
      return {
        VariableDeclarator(node) {
          if (
            node.id.type !== AST_NODE_TYPES.Identifier ||
            (node.id.name !== "warm" && node.id.name !== "result") ||
            node.init?.type !== AST_NODE_TYPES.BinaryExpression
          )
            return;
          const before = scopeLookups;
          proofs.push(isBooleanExpression(node.init.left, sourceCode));
          firstScopeLookups += scopeLookups - before;
          const afterFirst = scopeLookups;
          proofs.push(isBooleanExpression(node.init.left, sourceCode));
          repeatedScopeLookups += scopeLookups - afterFirst;
        },
      };
    },
  };
  const messages = new TSESLint.Linter().verify(code, [
    {
      languageOptions: { sourceType: "commonjs" },
      plugins: { test: { rules: { measure: measuringRule } } },
      rules: { "test/measure": "error" },
    },
  ]);
  return { messages, proofs, firstScopeLookups, repeatedScopeLookups };
}

describe("boolean proof traversal", () => {
  it("bounds scope lookups for shared initializer graphs", () => {
    const result = measureProofs(`
      const b0 = true;
      const b1 = b0 && b0;
      const b2 = b1 && b1;
      const b3 = b2 && b2;
      const b4 = b3 && b3;
      const b5 = b4 && b4;
      const b6 = b5 && b5;
      const b7 = b6 && b6;
      const b8 = b7 && b7;
      const b9 = b8 && b8;
      const b10 = b9 && b9;
      const b11 = b10 && b10;
      const b12 = b11 && b11;
      const result = b12 === true;
    `);
    expect(result.messages).toEqual([]);
    expect(result.proofs).toEqual([true, true]);
    expect(result.firstScopeLookups).toBeLessThanOrEqual(200);
    expect(result.repeatedScopeLookups).toBe(0);
  });

  it("reuses completed negative proofs", () => {
    const result = measureProofs("const result = unknown === true;");
    expect(result.messages).toEqual([]);
    expect(result.proofs).toEqual([false, false]);
    expect(result.repeatedScopeLookups).toBe(0);
  });

  it("does not prove mutable method calls return booleans", () => {
    const result = measureProofs(
      "const result = new Set().has(input) === true;",
    );
    expect(result.messages).toEqual([]);
    expect(result.proofs).toEqual([false, false]);
    expect(result.repeatedScopeLookups).toBe(0);
  });

  it("keeps proofs isolated between source files", () => {
    const known = measureProofs(
      "const flag = true; const result = flag === true;",
    );
    const unknown = measureProofs(
      "const flag = null; const result = flag === true;",
    );
    expect(known.messages).toEqual([]);
    expect(unknown.messages).toEqual([]);
    expect(known.proofs).toEqual([true, true]);
    expect(unknown.proofs).toEqual([false, false]);
  });

  it("does not reuse an outer binding proof for a shadowed parameter", () => {
    const result = measureProofs(
      "const flag = true; const warm = flag === true; function f(flag) { const result = flag === true; }",
    );
    expect(result.messages).toEqual([]);
    expect(result.proofs).toEqual([true, true, false, false]);
  });

  it("does not bypass dynamic with scopes after warming a boolean proof", () => {
    const result = measureProofs(
      "const flag = true; const warm = flag === true; with (custom) { const result = flag === true; }",
    );
    expect(result.messages).toEqual([]);
    expect(result.proofs).toEqual([true, true, false, false]);
  });

  it("retains forward-reference guards after warming an initializer", () => {
    const result = measureProofs(
      "const early = flag; const flag = true; const warm = flag === true; const result = early === true;",
    );
    expect(result.messages).toEqual([]);
    expect(result.proofs).toEqual([true, true, false, false]);
  });

  it("declines cyclic constant initializers", () => {
    const result = measureProofs(
      "const left = right; const right = left; const result = left === true;",
    );
    expect(result.messages).toEqual([]);
    expect(result.proofs).toEqual([false, false]);
  });
});
