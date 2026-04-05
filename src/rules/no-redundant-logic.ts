import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds =
  | "redundantBooleanComparison"
  | "redundantBooleanComparisonSuggest";

function isBooleanLiteral(
  node: TSESTree.Node,
): node is TSESTree.Literal & { value: boolean } {
  return (
    node.type === AST_NODE_TYPES.Literal && typeof node.value === "boolean"
  );
}

export default createRule<[], MessageIds>({
  name: "no-redundant-logic",
  meta: {
    type: "suggestion",
    hasSuggestions: true,
    docs: {
      description:
        "Disallow redundant boolean logic and unnecessary control flow patterns",
    },
    messages: {
      redundantBooleanComparison: [
        "Redundant comparison to boolean literal — compare directly to the value.",
        "",
        "Why: Comparing a boolean expression to `true` or `false` is redundant.",
        "The expression already evaluates to a boolean, so the comparison adds noise",
        "without changing the semantics.",
        "",
        "How to fix:",
        "  Before: if (isActive === true) { }",
        "  After:  if (isActive) { }",
        "",
        "  Before: if (isValid !== true) { }",
        "  After:  if (!isValid) { }",
        "",
        "  Before: if (hasPermission === false) { }",
        "  After:  if (!hasPermission) { }",
      ].join("\n"),
      redundantBooleanComparisonSuggest: "Remove redundant boolean comparison",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    // Pattern 1: redundant boolean comparison (x === true, x !== false, etc.)
    function checkBooleanComparison(node: TSESTree.BinaryExpression): void {
      if (node.operator !== "===" && node.operator !== "!==") return;

      const leftIsBool = isBooleanLiteral(node.left);
      const rightIsBool = isBooleanLiteral(node.right);

      if (!leftIsBool && !rightIsBool) return;

      const boolSide = leftIsBool
        ? (node.left as TSESTree.Literal & { value: boolean })
        : (node.right as TSESTree.Literal & { value: boolean });
      const otherSide = leftIsBool ? node.right : node.left;

      const boolVal = boolSide.value;
      const op = node.operator;
      // Negate when: === false  OR  !== true
      const negative = (op === "===" && !boolVal) || (op === "!==" && boolVal);

      context.report({
        node,
        messageId: "redundantBooleanComparison",
        suggest: [
          {
            messageId: "redundantBooleanComparisonSuggest",
            fix(fixer) {
              const text = sourceCode.getText(otherSide);
              if (negative) {
                const needsParens =
                  otherSide.type !== AST_NODE_TYPES.Identifier &&
                  otherSide.type !== AST_NODE_TYPES.MemberExpression &&
                  otherSide.type !== AST_NODE_TYPES.CallExpression;
                return fixer.replaceText(
                  node,
                  needsParens ? `!(${text})` : `!${text}`,
                );
              }
              return fixer.replaceText(node, text);
            },
          },
        ],
      });
    }

    return {
      BinaryExpression: checkBooleanComparison,
    };
  },
});
