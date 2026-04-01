import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds = "maxFunctionLength";

type Options = [
  {
    max?: number;
    skipBlankLines?: boolean;
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
        "Why: Long functions are hard to understand, test, and maintain.",
        "They often do too many things and hide bugs in nested logic.",
        "",
        "How to fix:",
        "  1. Extract logical sections into named helper functions",
        "  2. Each function should do one thing — if you can't name it clearly, it's doing too much",
        "  3. Move setup/validation to the top, core logic in the middle, cleanup at the bottom",
        "     Then extract each section into its own function",
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
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ max: 50, skipBlankLines: true }],
  create(context, [options]) {
    const max = options.max ?? 50;
    const skipBlankLines = options.skipBlankLines ?? true;
    const sourceCode = context.sourceCode;

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
