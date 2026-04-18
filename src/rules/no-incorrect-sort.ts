import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "noIncorrectSort";

const TYPED_ARRAY_NAMES = new Set([
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Uint16Array",
  "Int32Array",
  "Uint32Array",
  "Float32Array",
  "Float64Array",
  "BigInt64Array",
  "BigUint64Array",
]);

function isTypedArrayReceiver(node: TSESTree.MemberExpression): boolean {
  const object = node.object;

  if (object.type === AST_NODE_TYPES.NewExpression) {
    const callee = object.callee;
    if (
      callee.type === AST_NODE_TYPES.Identifier &&
      TYPED_ARRAY_NAMES.has(callee.name)
    ) {
      return true;
    }
  }

  if (object.type === AST_NODE_TYPES.Identifier) {
    const name = object.name;
    for (const typedName of TYPED_ARRAY_NAMES) {
      if (name.startsWith(typedName.charAt(0).toLowerCase())) {
        return false;
      }
    }
  }

  return false;
}

export default createRule<[], MessageIds>({
  name: "no-incorrect-sort",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow .sort() without a compare function, which coerces elements to strings and produces incorrect numeric ordering",
    },
    messages: {
      noIncorrectSort: [
        ".sort() without a compare function converts elements to strings before comparing, producing incorrect numeric order ([10, 2, 1].sort() → [1, 10, 2]).",
        "",
        "Why: JavaScript's default sort uses string comparison, not numeric. This means [10, 2, 1].sort() returns [1, 10, 2] instead of [1, 2, 10]. The code looks correct but silently produces wrong results that pass casual review.",
        "",
        "How to fix:",
        "  For numbers: arr.sort((a, b) => a - b)",
        "  For strings with locale: arr.sort((a, b) => a.localeCompare(b))",
        "  For objects by property: arr.sort((a, b) => a.key.localeCompare(b.key))",
        "  For descending order: arr.sort((a, b) => b - a)",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return;

        const prop = node.callee.property;
        if (prop.type !== AST_NODE_TYPES.Identifier || prop.name !== "sort")
          return;

        if (isTypedArrayReceiver(node.callee)) return;

        const args = node.arguments;
        if (args.length === 0) {
          context.report({ node, messageId: "noIncorrectSort" });
          return;
        }

        const [firstArg] = args;
        if (
          firstArg.type === AST_NODE_TYPES.Identifier &&
          firstArg.name === "undefined"
        ) {
          context.report({ node, messageId: "noIncorrectSort" });
          return;
        }

        if (
          firstArg.type === AST_NODE_TYPES.UnaryExpression &&
          firstArg.operator === "void"
        ) {
          context.report({ node, messageId: "noIncorrectSort" });
        }
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Always pass a compare function to .sort() — default sort coerces to strings",
};
