import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "noAnyInGeneric";

export const instruction: RuleInstruction = {
  principle: "Never use 'any' as a generic type argument",
};

export default createRule<[], MessageIds>({
  name: "no-any-in-generic",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `any` as a generic type argument in type references, arrays, and other parameterized types",
    },
    messages: {
      noAnyInGeneric: [
        "Do not use 'any' as a generic type argument in '{{ type }}' — use a specific type or 'unknown'.",
        "",
        "Why: Using `any` inside generics like Array<any>, Record<string, any>,",
        "or Map<string, any> silently disables type checking for every value",
        "that flows through the container. TypeScript cannot catch misuse of",
        "these values, and the `any` leaks into every access and assignment.",
        "",
        "How to fix:",
        "  Before: const items: Array<any> = [];",
        "  After:  const items: Array<unknown> = [];",
        "  Better: const items: Array<User> = [];",
        "",
        "  Before: const cache: Record<string, any> = {};",
        "  After:  const cache: Record<string, unknown> = {};",
        "  Better: const cache: Record<string, CacheEntry> = {};",
        "",
        "If the type is truly dynamic, use `unknown` and narrow with type guards.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function checkTypeParameters(
      params: TSESTree.TSTypeParameterInstantiation,
      parentName: string,
    ) {
      for (const param of params.params) {
        if (param.type === AST_NODE_TYPES.TSAnyKeyword) {
          context.report({
            node: param,
            messageId: "noAnyInGeneric",
            data: {
              type: parentName,
            },
          });
        }
      }
    }

    function getCalleeText(node: TSESTree.CallExpression): string {
      const callee = node.callee;
      if (callee.type === AST_NODE_TYPES.Identifier) {
        return callee.name;
      }
      return context.sourceCode.getText(callee);
    }

    return {
      TSTypeReference(node: TSESTree.TSTypeReference) {
        if (!node.typeArguments) return;

        let typeName: string;
        if (node.typeName.type === AST_NODE_TYPES.Identifier) {
          typeName = node.typeName.name;
        } else {
          const sourceCode = context.sourceCode;
          typeName = sourceCode.getText(node.typeName);
        }

        checkTypeParameters(node.typeArguments, typeName);
      },
      CallExpression(node: TSESTree.CallExpression) {
        if (!node.typeArguments) return;
        checkTypeParameters(node.typeArguments, getCalleeText(node));
      },
      NewExpression(node: TSESTree.NewExpression) {
        if (!node.typeArguments) return;
        const name =
          node.callee.type === AST_NODE_TYPES.Identifier
            ? node.callee.name
            : context.sourceCode.getText(node.callee);
        checkTypeParameters(node.typeArguments, name);
      },
    };
  },
});
