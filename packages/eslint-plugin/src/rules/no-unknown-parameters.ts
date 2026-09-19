import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

function getAnnotation(
  parameter: TSESTree.Parameter,
): TSESTree.TSTypeAnnotation | undefined {
  if (parameter.type === AST_NODE_TYPES.TSParameterProperty)
    return getAnnotation(parameter.parameter);
  if (parameter.type === AST_NODE_TYPES.RestElement)
    return parameter.typeAnnotation;
  if (parameter.type === AST_NODE_TYPES.AssignmentPattern)
    return parameter.left.typeAnnotation;
  return parameter.typeAnnotation;
}

export default createRule<[], "unknownParameter">({
  name: "no-unknown-parameters",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow explicit unknown function parameters except error-cause enrichment",
    },
    messages: {
      unknownParameter: [
        "Parameter '{{ name }}' is explicitly `unknown`.",
        "Why: An unknown input should be decoded once at the I/O boundary, not passed through the application contract.",
        "How to fix:",
        "  Parse the external value into a named domain type before calling this function. The `cause` parameter is allowed for error enrichment.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const check = (node: TSESTree.FunctionLike) => {
      for (const parameter of node.params) {
        const type = getAnnotation(parameter)?.typeAnnotation;
        if (type?.type !== AST_NODE_TYPES.TSUnknownKeyword) continue;
        if (
          parameter.type === AST_NODE_TYPES.Identifier &&
          parameter.name === "cause"
        )
          continue;
        const name =
          parameter.type === AST_NODE_TYPES.Identifier
            ? parameter.name
            : context.sourceCode.getText(parameter);
        context.report({
          node: type,
          messageId: "unknownParameter",
          data: { name },
        });
      }
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
    "Decode unknown external inputs at the boundary instead of propagating unknown parameters",
};
