import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type Assertion = TSESTree.TSAsExpression | TSESTree.TSTypeAssertion;

function isAssertion(node: TSESTree.Node): node is Assertion {
  return (
    node.type === AST_NODE_TYPES.TSAsExpression ||
    node.type === AST_NODE_TYPES.TSTypeAssertion
  );
}

function unwrap(node: TSESTree.Expression): TSESTree.Expression {
  let current = node;
  while (current.type === AST_NODE_TYPES.ChainExpression) {
    current = current.expression as TSESTree.Expression;
  }
  return current;
}

function isConstAssertion(node: Assertion): boolean {
  return (
    node.typeAnnotation.type === AST_NODE_TYPES.TSTypeReference &&
    node.typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier &&
    node.typeAnnotation.typeName.name === "const"
  );
}

function isOutermost(node: Assertion): boolean {
  let current: TSESTree.Node = node;
  let parent = node.parent;
  while (
    parent?.type === AST_NODE_TYPES.TSAsExpression ||
    parent?.type === AST_NODE_TYPES.TSTypeAssertion
  ) {
    if (parent.expression !== current) break;
    current = parent;
    parent = parent.parent;
  }
  return !isAssertion(parent);
}

function hasForbiddenChain(node: Assertion): boolean {
  let count = 0;
  let hasNonConst = false;
  let current: TSESTree.Expression = node;
  while (isAssertion(current)) {
    count += 1;
    hasNonConst ||= !isConstAssertion(current);
    current = unwrap(current.expression);
  }
  return count > 1 && hasNonConst;
}

export default createRule<[], "chained">({
  name: "no-chained-type-assertions",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow chained TypeScript type assertions that discard type evidence",
    },
    messages: {
      chained: [
        "This assertion chain discards type evidence.",
        "Why: Each additional assertion hides information the compiler could have used to catch a mismatch.",
        "How to fix:",
        "  Keep the original precise type, or parse untrusted input once at its boundary before narrowing it.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const check = (node: Assertion) => {
      if (isOutermost(node) && hasForbiddenChain(node)) {
        context.report({ node, messageId: "chained" });
      }
    };
    return {
      TSAsExpression: check,
      TSTypeAssertion: check,
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Do not chain type assertions; preserve precise type evidence or decode unknown input at its boundary",
};
