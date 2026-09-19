import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

function isUnknown(type: TSESTree.TypeNode): boolean {
  if (type.type === AST_NODE_TYPES.TSUnknownKeyword) return true;
  return (
    type.type === AST_NODE_TYPES.TSTypeReference &&
    type.typeName.type === AST_NODE_TYPES.Identifier &&
    type.typeName.name === "Promise" &&
    type.typeArguments?.params.length === 1 &&
    isUnknown(type.typeArguments.params[0]!)
  );
}

export default createRule<[], "unknownReturn">({
  name: "no-unknown-returns",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow function return contracts that expose unknown",
    },
    messages: {
      unknownReturn: [
        "Function '{{ name }}' returns `unknown`.",
        "Why: Callers cannot safely use an unknown result without repeating boundary decoding.",
        "How to fix:",
        "  Decode the value inside this function and return a named domain type instead.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const check = (node: TSESTree.FunctionLike) => {
      const type = node.returnType?.typeAnnotation;
      if (!type || !isUnknown(type)) return;
      const name =
        node.type === AST_NODE_TYPES.FunctionDeclaration && node.id
          ? node.id.name
          : "anonymous function";
      context.report({
        node: type,
        messageId: "unknownReturn",
        data: { name },
      });
    };
    return {
      ArrowFunctionExpression: check,
      FunctionDeclaration: check,
      FunctionExpression: check,
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Decode values before returning them so function contracts expose meaningful domain types",
};
