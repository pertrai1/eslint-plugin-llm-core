import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds =
  | "redundantBooleanComparison"
  | "redundantBooleanComparisonSuggest"
  | "unnecessaryElse"
  | "unnecessaryElseSuggest";

function isBooleanLiteral(
  node: TSESTree.Node,
): node is TSESTree.Literal & { value: boolean } {
  return (
    node.type === AST_NODE_TYPES.Literal && typeof node.value === "boolean"
  );
}

function isReturnOrThrow(node: TSESTree.Statement): boolean {
  return (
    node.type === AST_NODE_TYPES.ReturnStatement ||
    node.type === AST_NODE_TYPES.ThrowStatement
  );
}

function consequentEndsWithReturnOrThrow(
  consequent: TSESTree.Statement,
): boolean {
  if (isReturnOrThrow(consequent)) return true;
  if (consequent.type === AST_NODE_TYPES.BlockStatement) {
    const last = consequent.body[consequent.body.length - 1];
    return last !== undefined && isReturnOrThrow(last);
  }
  return false;
}

function alternateIsSimple(alternate: TSESTree.Statement): boolean {
  // Direct return or throw (no block): else return x;
  if (isReturnOrThrow(alternate)) return true;
  // Block with exactly one return or throw: else { return x; }
  if (
    alternate.type === AST_NODE_TYPES.BlockStatement &&
    alternate.body.length === 1 &&
    isReturnOrThrow(alternate.body[0])
  ) {
    return true;
  }
  return false;
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
      unnecessaryElse: [
        "Unnecessary `else` — the preceding `if` block always exits.",
        "",
        "Why: When an `if` block ends with `return` or `throw`, the `else` branch",
        "is unreachable via fall-through. Keeping the `else` adds nesting without",
        "benefit and obscures the control flow.",
        "",
        "How to fix:",
        "  Before: if (status === 'active') {",
        "            return 'Active';",
        "          } else {",
        "            return 'Inactive';",
        "          }",
        "  After:  if (status === 'active') {",
        "            return 'Active';",
        "          }",
        "          return 'Inactive';",
      ].join("\n"),
      unnecessaryElseSuggest: "Remove unnecessary else block",
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

    // Pattern 2: unnecessary else after return/throw
    function checkUnnecessaryElse(node: TSESTree.IfStatement): void {
      if (!node.alternate) return;
      // Exclude else-if chains
      if (node.alternate.type === AST_NODE_TYPES.IfStatement) return;
      if (!consequentEndsWithReturnOrThrow(node.consequent)) return;
      if (!alternateIsSimple(node.alternate)) return;

      const alternate = node.alternate;

      context.report({
        node: alternate,
        messageId: "unnecessaryElse",
        suggest: [
          {
            messageId: "unnecessaryElseSuggest",
            fix(fixer) {
              const ifIndent = " ".repeat(node.loc.start.column);
              const consequentEnd = node.consequent.range[1];
              const alternateEnd = alternate.range[1];

              let innerText: string;
              if (alternate.type === AST_NODE_TYPES.BlockStatement) {
                innerText = sourceCode.getText(alternate.body[0]);
              } else {
                innerText = sourceCode.getText(alternate);
              }

              return fixer.replaceTextRange(
                [consequentEnd, alternateEnd],
                `\n${ifIndent}${innerText}`,
              );
            },
          },
        ],
      });
    }

    return {
      BinaryExpression: checkBooleanComparison,
      IfStatement: checkUnnecessaryElse,
    };
  },
});
