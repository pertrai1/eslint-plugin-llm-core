import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

export default createRule<[], "unknownAlias">({
  name: "no-unknown-type-aliases",
  meta: {
    type: "problem",
    docs: { description: "Disallow named type aliases that conceal unknown" },
    messages: {
      unknownAlias: [
        "Type alias '{{ name }}' conceals `unknown`.",
        "Why: Naming the escape hatch makes an undecoded boundary value look like a domain contract.",
        "How to fix:",
        "  Keep `unknown` visible at the boundary, then decode it into a named validated type.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const aliases = new Map<string, TSESTree.TypeNode>();
    const resolvesToUnknown = (
      type: TSESTree.TypeNode,
      seen = new Set<string>(),
    ): boolean => {
      if (type.type === AST_NODE_TYPES.TSUnknownKeyword) return true;
      if (
        type.type !== AST_NODE_TYPES.TSTypeReference ||
        type.typeName.type !== AST_NODE_TYPES.Identifier ||
        seen.has(type.typeName.name)
      )
        return false;
      const target = aliases.get(type.typeName.name);
      if (!target) return false;
      seen.add(type.typeName.name);
      return resolvesToUnknown(target, seen);
    };
    return {
      TSTypeAliasDeclaration(node) {
        aliases.set(node.id.name, node.typeAnnotation);
        if (resolvesToUnknown(node.typeAnnotation))
          context.report({
            node: node.typeAnnotation,
            messageId: "unknownAlias",
            data: { name: node.id.name },
          });
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Keep unknown visible at an I/O boundary instead of hiding it behind a named alias",
};
