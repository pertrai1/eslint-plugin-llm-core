import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

function isBroad(type: TSESTree.TypeNode): boolean {
  const node = type;
  if (
    node.type === AST_NODE_TYPES.TSAnyKeyword ||
    node.type === AST_NODE_TYPES.TSUnknownKeyword ||
    node.type === AST_NODE_TYPES.TSObjectKeyword
  )
    return true;
  if (
    node.type !== AST_NODE_TYPES.TSTypeReference ||
    node.typeName.type !== AST_NODE_TYPES.Identifier
  )
    return false;
  if (node.typeName.name !== "Record") return false;
  const params = node.typeArguments?.params ?? [];
  return (
    params.length === 2 &&
    (params[1]?.type === AST_NODE_TYPES.TSAnyKeyword ||
      params[1]?.type === AST_NODE_TYPES.TSUnknownKeyword)
  );
}

function isKnownExpression(node: TSESTree.Expression): boolean {
  if (node.type === AST_NODE_TYPES.Literal) return node.value !== null;
  return [
    AST_NODE_TYPES.TemplateLiteral,
    AST_NODE_TYPES.ObjectExpression,
    AST_NODE_TYPES.ArrayExpression,
    AST_NODE_TYPES.ArrowFunctionExpression,
    AST_NODE_TYPES.FunctionExpression,
    AST_NODE_TYPES.ClassExpression,
    AST_NODE_TYPES.NewExpression,
  ].includes(node.type);
}

export default createRule<[], "widening">({
  name: "no-known-value-widening",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow broad explicit types that discard known value evidence",
    },
    messages: {
      widening: [
        "The explicit type on '{{ name }}' discards known type evidence.",
        "Why: The initializer already establishes a more useful concrete type, but the annotation widens it to an escape hatch.",
        "How to fix:",
        "  Keep inference, validate with `satisfies`, or use a named owner contract instead of `any`, `unknown`, `object`, or an unsafe dictionary.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      VariableDeclarator(node) {
        if (
          node.id.type !== AST_NODE_TYPES.Identifier ||
          !node.id.typeAnnotation ||
          !node.init
        )
          return;
        if (
          isBroad(node.id.typeAnnotation.typeAnnotation) &&
          isKnownExpression(node.init)
        ) {
          context.report({
            node: node.id.typeAnnotation,
            messageId: "widening",
            data: { name: node.id.name },
          });
        }
      },
      PropertyDefinition(node) {
        if (
          !node.typeAnnotation ||
          !node.value ||
          !isBroad(node.typeAnnotation.typeAnnotation)
        )
          return;
        if (isKnownExpression(node.value))
          context.report({
            node: node.typeAnnotation,
            messageId: "widening",
            data: { name: context.sourceCode.getText(node.key) },
          });
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Preserve known type evidence instead of widening concrete values to broad escape-hatch types",
};
