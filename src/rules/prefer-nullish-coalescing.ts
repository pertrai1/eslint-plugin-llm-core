import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "preferNullishCoalescing" | "useNullishCoalescing";

function isBooleanLiteral(node: TSESTree.Node): boolean {
  return (
    node.type === AST_NODE_TYPES.Literal && typeof node.value === "boolean"
  );
}

function isBooleanNamed(name: string): boolean {
  return /^(is|has|can|should|will|was|were|did)[A-Z_]/.test(name);
}

function isBooleanNamedMemberExpression(
  node: TSESTree.MemberExpression,
): boolean {
  return (
    !node.computed &&
    node.property.type === AST_NODE_TYPES.Identifier &&
    isBooleanNamed(node.property.name)
  );
}

function hasLogicalOperand(node: TSESTree.LogicalExpression): boolean {
  return (
    node.left.type === AST_NODE_TYPES.LogicalExpression ||
    node.right.type === AST_NODE_TYPES.LogicalExpression
  );
}

function isBooleanishExpression(node: TSESTree.Node): boolean {
  if (isBooleanLiteral(node)) return true;

  if (node.type === AST_NODE_TYPES.Identifier) {
    return isBooleanNamed(node.name);
  }

  if (node.type === AST_NODE_TYPES.MemberExpression) {
    return isBooleanNamedMemberExpression(node);
  }

  if (node.type === AST_NODE_TYPES.ChainExpression) {
    return isBooleanishExpression(node.expression);
  }

  if (node.type === AST_NODE_TYPES.UnaryExpression && node.operator === "!") {
    return true;
  }

  if (node.type === AST_NODE_TYPES.BinaryExpression) {
    return [
      "===",
      "!==",
      "==",
      "!=",
      ">",
      ">=",
      "<",
      "<=",
      "in",
      "instanceof",
    ].includes(node.operator);
  }

  if (node.type === AST_NODE_TYPES.CallExpression) {
    const callee = node.callee;
    if (callee.type === AST_NODE_TYPES.Identifier) {
      return isBooleanNamed(callee.name);
    }
    if (
      callee.type === AST_NODE_TYPES.MemberExpression &&
      !callee.computed &&
      callee.property.type === AST_NODE_TYPES.Identifier
    ) {
      return isBooleanNamed(callee.property.name);
    }
  }

  return false;
}

function isFallbackCandidate(node: TSESTree.Node): boolean {
  if (isBooleanishExpression(node)) return false;

  return (
    node.type === AST_NODE_TYPES.Literal ||
    node.type === AST_NODE_TYPES.TemplateLiteral ||
    node.type === AST_NODE_TYPES.ObjectExpression ||
    node.type === AST_NODE_TYPES.ArrayExpression ||
    node.type === AST_NODE_TYPES.NewExpression ||
    node.type === AST_NODE_TYPES.CallExpression
  );
}

function isBooleanContext(node: TSESTree.LogicalExpression): boolean {
  const parent = node.parent;

  if (!parent) return false;

  if (
    (parent.type === AST_NODE_TYPES.IfStatement && parent.test === node) ||
    (parent.type === AST_NODE_TYPES.WhileStatement && parent.test === node) ||
    (parent.type === AST_NODE_TYPES.DoWhileStatement && parent.test === node) ||
    (parent.type === AST_NODE_TYPES.ForStatement && parent.test === node) ||
    (parent.type === AST_NODE_TYPES.ConditionalExpression &&
      parent.test === node) ||
    (parent.type === AST_NODE_TYPES.UnaryExpression && parent.operator === "!")
  ) {
    return true;
  }

  if (parent.type === AST_NODE_TYPES.LogicalExpression) {
    return true;
  }

  return false;
}

export default createRule<[], MessageIds>({
  name: "prefer-nullish-coalescing",
  meta: {
    type: "suggestion",
    hasSuggestions: true,
    docs: {
      description:
        "Prefer nullish coalescing over logical OR when providing default values",
    },
    messages: {
      preferNullishCoalescing: [
        "Use `??` instead of `||` when providing a default value.",
        "",
        'Why: `||` treats valid falsy values like `0`, `""`, and `false` as missing.',
        "`??` only falls back for `null` or `undefined`, preserving valid falsy input.",
        "",
        "How to fix:",
        "  Before: const count = value || 10;",
        "  After:  const count = value ?? 10;",
      ].join("\n"),
      useNullishCoalescing: "Replace `||` with `??` for this default value",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      LogicalExpression(node) {
        if (node.operator !== "||") return;
        if (isBooleanContext(node)) return;
        if (hasLogicalOperand(node)) return;
        if (isBooleanishExpression(node.left)) return;
        if (!isFallbackCandidate(node.right)) return;

        context.report({
          node,
          messageId: "preferNullishCoalescing",
          suggest: [
            {
              messageId: "useNullishCoalescing",
              fix(fixer) {
                const operator = sourceCode.getTokenAfter(node.left, {
                  filter: (token) => token.value === "||",
                });

                if (!operator) return null;

                return fixer.replaceText(operator, "??");
              },
            },
          ],
        });
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Use nullish coalescing (`??`) instead of logical OR (`||`) when providing default values so valid falsy values are preserved",
};
