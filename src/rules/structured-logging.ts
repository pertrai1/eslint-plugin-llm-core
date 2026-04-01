import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds = "dynamicLogMessage";

type Options = [
  {
    logFunctions?: string[];
    logMethods?: string[];
  },
];

const DEFAULT_LOG_FUNCTIONS = [
  "logError",
  "logInfo",
  "logWarn",
  "logDebug",
  "logException",
];

const DEFAULT_LOG_METHODS = ["log", "info", "warn", "error", "debug", "trace"];

function isDynamicString(node: TSESTree.Node): boolean {
  // Template literal with expressions
  if (
    node.type === AST_NODE_TYPES.TemplateLiteral &&
    node.expressions.length > 0
  ) {
    return true;
  }

  // String concatenation: 'foo' + bar
  if (node.type === AST_NODE_TYPES.BinaryExpression && node.operator === "+") {
    return true;
  }

  return false;
}

export default createRule<Options, MessageIds>({
  name: "structured-logging",
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce structured logging with static messages and dynamic values as separate metadata",
    },
    messages: {
      dynamicLogMessage: [
        "Log messages must be static strings. Pass dynamic values as structured metadata.",
        "",
        "Why: Dynamic log messages break log aggregation and make filtering impossible.",
        "Static messages group identical events together; structured metadata enables querying.",
        "",
        "How to fix:",
        "  Replace: {{ callee }}(`Failed for ${userId}`)",
        '  With:    {{ callee }}("Failed for user", { userId })',
      ].join("\n"),
    },
    schema: [
      {
        type: "object",
        properties: {
          logFunctions: {
            type: "array",
            items: { type: "string" },
            description:
              "Standalone logging function names to check (e.g., logError, logInfo)",
          },
          logMethods: {
            type: "array",
            items: { type: "string" },
            description:
              "Method names to check when called on any object (e.g., logger.error, console.warn)",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const logFunctions = new Set(options.logFunctions ?? DEFAULT_LOG_FUNCTIONS);
    const logMethods = new Set(options.logMethods ?? DEFAULT_LOG_METHODS);

    function getCalleeName(node: TSESTree.CallExpression): string | null {
      // Standalone function: logError(...)
      if (
        node.callee.type === AST_NODE_TYPES.Identifier &&
        logFunctions.has(node.callee.name)
      ) {
        return node.callee.name;
      }

      // Method call: logger.error(...), console.log(...)
      if (
        node.callee.type === AST_NODE_TYPES.MemberExpression &&
        node.callee.property.type === AST_NODE_TYPES.Identifier &&
        logMethods.has(node.callee.property.name)
      ) {
        const obj = node.callee.object;
        const method = node.callee.property.name;
        if (obj.type === AST_NODE_TYPES.Identifier) {
          return `${obj.name}.${method}`;
        }
        return method;
      }

      return null;
    }

    function findMessageArg(
      node: TSESTree.CallExpression,
    ): TSESTree.Node | null {
      if (node.arguments.length === 0) return null;

      const firstArg = node.arguments[0];

      // For logException(error, message, ...) patterns, check second arg
      // if first arg is an identifier (the error object)
      const callee = node.callee;
      if (
        callee.type === AST_NODE_TYPES.Identifier &&
        callee.name === "logException" &&
        node.arguments.length >= 2
      ) {
        return node.arguments[1];
      }

      return firstArg;
    }

    return {
      CallExpression(node) {
        const calleeName = getCalleeName(node);
        if (!calleeName) return;

        const messageArg = findMessageArg(node);
        if (!messageArg) return;

        if (isDynamicString(messageArg)) {
          context.report({
            node: messageArg,
            messageId: "dynamicLogMessage",
            data: { callee: calleeName },
          });
        }
      },
    };
  },
});
