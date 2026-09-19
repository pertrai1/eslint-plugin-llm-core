import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

function annotation(
  parameter: TSESTree.Parameter,
): TSESTree.TSTypeAnnotation | undefined {
  if (parameter.type === AST_NODE_TYPES.TSParameterProperty)
    return annotation(parameter.parameter);
  if (parameter.type === AST_NODE_TYPES.RestElement)
    return parameter.typeAnnotation;
  if (parameter.type === AST_NODE_TYPES.AssignmentPattern)
    return parameter.left.typeAnnotation;
  return parameter.typeAnnotation;
}

export default createRule<[], "objectParameter">({
  name: "no-object-parameters",
  meta: {
    type: "problem",
    docs: { description: "Disallow broad object types in function parameters" },
    messages: {
      objectParameter: [
        "Parameter '{{ name }}' uses the broad `object` type.",
        "Why: A broad input contract pushes parsing and validation into every caller.",
        "How to fix:",
        "  Accept a named owner type and parse external input at its boundary before calling this function.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const aliases = new Set<string>();
    const isObject = (
      type: TSESTree.TypeNode,
      seen = new Set<string>(),
    ): boolean => {
      if (type.type === AST_NODE_TYPES.TSObjectKeyword) return true;
      if (type.type === AST_NODE_TYPES.TSUnionType)
        return type.types.some((member) => isObject(member, seen));
      if (
        type.type !== AST_NODE_TYPES.TSTypeReference ||
        type.typeName.type !== AST_NODE_TYPES.Identifier ||
        seen.has(type.typeName.name)
      )
        return false;
      if (!aliases.has(type.typeName.name)) return false;
      seen.add(type.typeName.name);
      return true;
    };
    const check = (node: TSESTree.FunctionLike) => {
      for (const parameter of node.params) {
        const type = annotation(parameter)?.typeAnnotation;
        if (!type || !isObject(type)) continue;
        const name =
          parameter.type === AST_NODE_TYPES.Identifier
            ? parameter.name
            : context.sourceCode.getText(parameter);
        context.report({
          node: type,
          messageId: "objectParameter",
          data: { name },
        });
      }
    };
    return {
      Program(node) {
        aliases.clear();
        for (const statement of node.body) {
          const declaration =
            statement.type === AST_NODE_TYPES.ExportNamedDeclaration
              ? statement.declaration
              : statement;
          if (
            declaration?.type === AST_NODE_TYPES.TSTypeAliasDeclaration &&
            declaration.typeAnnotation.type === AST_NODE_TYPES.TSObjectKeyword
          )
            aliases.add(declaration.id.name);
        }
      },
      ArrowFunctionExpression: check,
      FunctionDeclaration: check,
      FunctionExpression: check,
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Give function inputs named owner contracts instead of the broad object type",
};
