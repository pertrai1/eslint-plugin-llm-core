import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

function isEscapeHatch(type: TSESTree.TypeNode): boolean {
  return [
    AST_NODE_TYPES.TSAnyKeyword,
    AST_NODE_TYPES.TSUnknownKeyword,
    AST_NODE_TYPES.TSObjectKeyword,
    AST_NODE_TYPES.TSNeverKeyword,
  ].includes(type.type);
}

function isUnsafeDictionary(type: TSESTree.TypeNode): boolean {
  if (
    type.type === AST_NODE_TYPES.TSTypeReference &&
    type.typeName.type === AST_NODE_TYPES.Identifier &&
    type.typeName.name === "Record"
  ) {
    const value = type.typeArguments?.params[1];
    return (
      value !== undefined &&
      (isEscapeHatch(value) ||
        (value.type === AST_NODE_TYPES.TSTypeLiteral &&
          value.members.length === 0))
    );
  }
  if (type.type !== AST_NODE_TYPES.TSTypeLiteral) return false;
  return type.members.some((member) => {
    if (
      member.type !== AST_NODE_TYPES.TSIndexSignature ||
      !member.typeAnnotation
    )
      return false;
    return (
      isEscapeHatch(member.typeAnnotation.typeAnnotation) ||
      (member.typeAnnotation.typeAnnotation.type ===
        AST_NODE_TYPES.TSTypeLiteral &&
        member.typeAnnotation.typeAnnotation.members.length === 0)
    );
  });
}

export default createRule<[], "unsafeDictionary">({
  name: "no-unsafe-dictionary-type",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow dictionary contracts whose values use unsafe escape-hatch types",
    },
    messages: {
      unsafeDictionary: [
        "This dictionary has an unsafe value type.",
        "Why: `any`, `unknown`, `object`, or `{}` gives callers no concrete value contract and spreads unchecked data through the codebase.",
        "How to fix:",
        "  Use an owner/schema-derived value type and parse external payloads before insertion.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      TSTypeReference(node) {
        if (isUnsafeDictionary(node))
          context.report({ node, messageId: "unsafeDictionary" });
      },
      TSTypeLiteral(node) {
        if (isUnsafeDictionary(node))
          context.report({ node, messageId: "unsafeDictionary" });
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Give dictionaries concrete owner or schema-derived value types instead of unsafe escape hatches",
};
