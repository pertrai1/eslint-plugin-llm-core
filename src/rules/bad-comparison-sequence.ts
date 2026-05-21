import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "badComparisonSequence";

const COMPARISON_OPERATORS = new Set([
  "<",
  "<=",
  ">",
  ">=",
  "==",
  "!=",
  "===",
  "!==",
]);

function isComparisonOperator(operator: string): boolean {
  return COMPARISON_OPERATORS.has(operator);
}

function isBooleanLiteral(node: TSESTree.Node): boolean {
  return (
    node.type === AST_NODE_TYPES.Literal && typeof node.value === "boolean"
  );
}

function isComparisonExpression(
  node: TSESTree.Node,
): node is TSESTree.BinaryExpression {
  return (
    node.type === AST_NODE_TYPES.BinaryExpression &&
    isComparisonOperator(node.operator)
  );
}

function isExplicitBooleanCheck(node: TSESTree.BinaryExpression): boolean {
  return (
    (node.operator === "==" ||
      node.operator === "!=" ||
      node.operator === "===" ||
      node.operator === "!==") &&
    isBooleanLiteral(node.right)
  );
}

export default createRule<[], MessageIds>({
  name: "bad-comparison-sequence",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow chained equality and comparison expressions that compare an intermediate boolean result",
    },
    messages: {
      badComparisonSequence: [
        "This chained comparison does not work like mathematical notation in JavaScript/TypeScript.",
        "",
        "Why: JavaScript evaluates comparisons from left to right. `0 <= ratio <= 1` becomes `(0 <= ratio) <= 1`, so the second comparison compares `true` or `false` as a number instead of checking `ratio` against the upper bound. LLMs often generate this when translating range notation directly into code.",
        "",
        "How to fix:",
        "  Split the chain into explicit comparisons joined with &&.",
        "  Before: if (0 <= ratio <= 1) { ... }",
        "  After:  if (0 <= ratio && ratio <= 1) { ... }",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      BinaryExpression(node: TSESTree.BinaryExpression) {
        if (!isComparisonOperator(node.operator)) {
          return;
        }

        if (!isComparisonExpression(node.left)) {
          return;
        }

        if (isExplicitBooleanCheck(node)) {
          return;
        }

        context.report({
          node,
          messageId: "badComparisonSequence",
        });
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Do not write chained comparisons like 0 <= value <= 1; split range checks with &&",
};
