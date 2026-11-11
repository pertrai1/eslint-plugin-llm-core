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
        "",
        "Why: Every caller of an `unknown` result has to validate it again before using it.",
        "",
        "How to fix:",
        "  Before: function loadUser(): unknown { return JSON.parse(readUserFile()); }",
        "  After:  function loadUser(): User { return UserSchema.parse(JSON.parse(readUserFile())); }",
        "  Validate inside the function and return the named type. The same applies to Promise<unknown>.",
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
