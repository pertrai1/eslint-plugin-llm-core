import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds = "maxParams";

type Options = [
  {
    max?: number;
    maxConstructor?: number;
    maxInternal?: number;
  },
];

export default createRule<Options, MessageIds>({
  name: "max-params",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce a maximum number of function parameters to encourage object parameter patterns",
    },
    messages: {
      maxParams: [
        "Function '{{ name }}' has {{ count }} parameters, exceeding the maximum of {{ max }}.",
        "",
        "Why: Functions with many positional parameters are hard to call correctly.",
        "Parameter order is easy to confuse, especially for callers unfamiliar with the API.",
        "",
        "How to fix:",
        "  Use a single options object with destructuring:",
        "",
        "  Before: function {{ name }}({{ params }}) { ... }",
        "  After:  function {{ name }}(options: { {{ params }} }) {",
        "            const { {{ paramNames }} } = options;",
        "            ...",
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
            description:
              "Maximum allowed parameters for functions (default: 2)",
          },
          maxConstructor: {
            type: "integer",
            minimum: 1,
            description:
              "Maximum allowed parameters for class constructors (default: 5)",
          },
          maxInternal: {
            type: "integer",
            minimum: 1,
            description:
              "Maximum allowed parameters for non-exported functions (default: same as max)",
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ max: 2, maxConstructor: 5 }],
  },
  defaultOptions: [{ max: 2, maxConstructor: 5 }],
  create(context, [options]) {
    const max = options.max ?? 2;
    const maxConstructor = options.maxConstructor ?? 5;
    const maxInternal = options.maxInternal ?? max;
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

      // Check if assigned to a variable
      if (
        node.parent &&
        node.parent.type === AST_NODE_TYPES.VariableDeclarator &&
        node.parent.id.type === AST_NODE_TYPES.Identifier
      ) {
        return node.parent.id.name;
      }

      // Check if it's a method
      if (
        node.parent &&
        node.parent.type === AST_NODE_TYPES.MethodDefinition &&
        node.parent.key.type === AST_NODE_TYPES.Identifier
      ) {
        return node.parent.key.name;
      }

      if (
        node.parent &&
        node.parent.type === AST_NODE_TYPES.Property &&
        node.parent.key.type === AST_NODE_TYPES.Identifier
      ) {
        return node.parent.key.name;
      }

      return "anonymous";
    }

    function isConstructor(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression,
    ): boolean {
      return (
        node.parent?.type === AST_NODE_TYPES.MethodDefinition &&
        node.parent.kind === "constructor"
      );
    }

    function isExported(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression,
    ): boolean {
      if (isConstructor(node)) {
        return false;
      }

      if (node.parent?.type === AST_NODE_TYPES.ExportNamedDeclaration) {
        return true;
      }

      if (node.parent?.type === AST_NODE_TYPES.ExportDefaultDeclaration) {
        return true;
      }

      if (
        node.parent?.type === AST_NODE_TYPES.VariableDeclarator &&
        node.parent.parent?.type === AST_NODE_TYPES.VariableDeclaration &&
        node.parent.parent.parent?.type ===
          AST_NODE_TYPES.ExportNamedDeclaration
      ) {
        return true;
      }

      // Detect re-exported functions: function helper() {} export { helper }
      if (
        node.parent?.type === AST_NODE_TYPES.Program &&
        node.type === AST_NODE_TYPES.FunctionDeclaration &&
        node.id
      ) {
        const program = node.parent;
        const funcName = node.id.name;
        for (const stmt of program.body) {
          if (
            stmt.type === AST_NODE_TYPES.ExportNamedDeclaration &&
            stmt.source == null &&
            stmt.specifiers.some(
              (spec) =>
                spec.type === AST_NODE_TYPES.ExportSpecifier &&
                spec.local.type === AST_NODE_TYPES.Identifier &&
                spec.local.name === funcName,
            )
          ) {
            return true;
          }
        }
      }

      return false;
    }

    function checkParams(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression,
    ): void {
      const limit = isConstructor(node)
        ? maxConstructor
        : isExported(node)
          ? max
          : maxInternal;
      const count = node.params.length;

      if (count <= limit) return;

      const name = getFunctionName(node);
      const params = node.params.map((p) => sourceCode.getText(p)).join(", ");
      const paramNames = node.params
        .map((p) => {
          if (p.type === AST_NODE_TYPES.Identifier) return p.name;
          if (
            p.type === AST_NODE_TYPES.AssignmentPattern &&
            p.left.type === AST_NODE_TYPES.Identifier
          ) {
            return p.left.name;
          }
          return sourceCode.getText(p);
        })
        .join(", ");

      context.report({
        node,
        messageId: "maxParams",
        data: {
          name,
          count: String(count),
          max: String(limit),
          params,
          paramNames,
        },
      });
    }

    return {
      FunctionDeclaration: checkParams,
      FunctionExpression: checkParams,
      ArrowFunctionExpression: checkParams,
    };
  },
});
