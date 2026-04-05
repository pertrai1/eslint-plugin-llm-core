import path from "path";
import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds = "maxFunctionLength";

type Options = [
  {
    max?: number;
    skipBlankLines?: boolean;
    skipTestFiles?: boolean;
  },
];

export default createRule<Options, MessageIds>({
  name: "max-function-length",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce a maximum number of lines per function to encourage decomposition",
    },
    messages: {
      maxFunctionLength: [
        "Function '{{ name }}' has {{ lines }} lines, exceeding the maximum of {{ max }}.",
        "",
        "Why: Long functions hide multiple steps behind one name, which makes small safe edits harder.",
        "",
        "How to fix:",
        "  Keep '{{ name }}' as the coordinator and extract one named step at a time.",
        "  Before: function processOrder(order) { validate(order); calculate(order); save(order); }",
        "  After:  function processOrder(order) {",
        "            validateOrder(order);",
        "            const total = calculateOrderTotal(order);",
        "            return saveOrder(order, total);",
        "          }",
      ].join("\n"),
    },
    schema: [
      {
        type: "object",
        properties: {
          max: {
            type: "integer",
            minimum: 1,
            description: "Maximum allowed lines per function (default: 50)",
          },
          skipBlankLines: {
            type: "boolean",
            description:
              "Whether to skip blank lines when counting (default: true)",
          },
          skipTestFiles: {
            type: "boolean",
            description:
              "Whether to skip test files (.test.ts, .spec.ts) (default: true)",
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ max: 50, skipBlankLines: true, skipTestFiles: true }],
  },
  defaultOptions: [{ max: 50, skipBlankLines: true, skipTestFiles: true }],
  create(context, [options]) {
    const max = options.max ?? 50;
    const skipBlankLines = options.skipBlankLines ?? true;
    const skipTestFiles = options.skipTestFiles ?? true;
    const sourceCode = context.sourceCode;

    if (skipTestFiles) {
      const filename = path.basename(context.filename);
      if (/\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filename)) {
        return {};
      }
    }

    function getFunctionName(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression,
    ): string {
      if (node.type === AST_NODE_TYPES.FunctionDeclaration && node.id) {
        return node.id.name;
      }

      if (node.type === AST_NODE_TYPES.FunctionExpression && node.id) {
        return node.id.name;
      }

      if (
        node.parent?.type === AST_NODE_TYPES.VariableDeclarator &&
        node.parent.id.type === AST_NODE_TYPES.Identifier
      ) {
        return node.parent.id.name;
      }

      if (
        node.parent?.type === AST_NODE_TYPES.MethodDefinition &&
        node.parent.key.type === AST_NODE_TYPES.Identifier
      ) {
        return node.parent.key.name;
      }

      if (
        node.parent?.type === AST_NODE_TYPES.Property &&
        node.parent.key.type === AST_NODE_TYPES.Identifier
      ) {
        return node.parent.key.name;
      }

      return "anonymous";
    }

    function countLines(node: TSESTree.Node): number {
      const startLine = node.loc.start.line;
      const endLine = node.loc.end.line;

      if (!skipBlankLines) {
        return endLine - startLine + 1;
      }

      const lines = sourceCode.getText(node).split("\n");
      return lines.filter((line) => line.trim().length > 0).length;
    }

    function checkFunction(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression,
    ): void {
      const lines = countLines(node);
      if (lines <= max) return;

      context.report({
        node,
        messageId: "maxFunctionLength",
        data: {
          name: getFunctionName(node),
          lines: String(lines),
          max: String(max),
        },
      });
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
});
