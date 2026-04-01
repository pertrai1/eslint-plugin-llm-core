import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds = "missingBasePrefix" | "missingErrorSuffix";

export default createRule<[], MessageIds>({
  name: "naming-conventions",
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce naming conventions: Base prefix for abstract classes, Error suffix for error classes",
    },
    messages: {
      missingBasePrefix: [
        "Abstract class '{{ className }}' must use the 'Base' prefix (e.g., 'Base{{ className }}').",
        "",
        "Why: The 'Base' prefix signals that a class is abstract and cannot be instantiated directly.",
        "Without it, consumers may try to instantiate the class, causing runtime errors.",
        "",
        "How to fix:",
        "  Rename: abstract class {{ className }} { ... }",
        "  To:     abstract class Base{{ className }} { ... }",
      ].join("\n"),
      missingErrorSuffix: [
        "Error class '{{ className }}' must use the 'Error' suffix (e.g., '{{ className }}Error').",
        "",
        "Why: The 'Error' suffix makes it immediately clear that a class represents an error condition.",
        "Without it, catch blocks and error handling become harder to understand.",
        "",
        "How to fix:",
        "  Rename: class {{ className }} extends {{ superName }} { ... }",
        "  To:     class {{ className }}Error extends {{ superName }} { ... }",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ClassDeclaration(node) {
        if (!node.id) return;

        const className = node.id.name;

        // Abstract classes must have Base prefix
        if (node.abstract && !className.startsWith("Base")) {
          context.report({
            node: node.id,
            messageId: "missingBasePrefix",
            data: { className },
          });
        }

        // Error classes must have Error suffix
        if (node.superClass) {
          const superName = getSuperClassName(node.superClass);
          if (!superName) return;

          const isErrorClass =
            superName === "Error" || superName.endsWith("Error");
          if (isErrorClass && !className.endsWith("Error")) {
            context.report({
              node: node.id,
              messageId: "missingErrorSuffix",
              data: { className, superName },
            });
          }
        }
      },
    };
  },
});

function getSuperClassName(
  node: TSESTree.LeftHandSideExpression,
): string | null {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name;
  }
  if (
    node.type === AST_NODE_TYPES.MemberExpression &&
    node.property.type === AST_NODE_TYPES.Identifier
  ) {
    return node.property.name;
  }
  return null;
}
