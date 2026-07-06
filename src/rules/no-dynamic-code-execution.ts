import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "noDynamicCodeExecution";

function isIdentifierNamed(node: TSESTree.Node, name: string): boolean {
  return node.type === AST_NODE_TYPES.Identifier && node.name === name;
}

function isGlobalObjectName(name: string): boolean {
  return name === "window" || name === "globalThis";
}

function isStaticMemberNamed(
  node: TSESTree.Node,
  objectName: string,
  propertyName: string,
): node is TSESTree.MemberExpression {
  return (
    node.type === AST_NODE_TYPES.MemberExpression &&
    !node.computed &&
    isIdentifierNamed(node.object, objectName) &&
    isIdentifierNamed(node.property, propertyName)
  );
}

function isGlobalMemberNamed(
  node: TSESTree.Node,
  propertyName: string,
): boolean {
  return (
    node.type === AST_NODE_TYPES.MemberExpression &&
    !node.computed &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    isGlobalObjectName(node.object.name) &&
    isIdentifierNamed(node.property, propertyName)
  );
}

function isEvalCallee(node: TSESTree.Node): boolean {
  return (
    isIdentifierNamed(node, "eval") ||
    isStaticMemberNamed(node, "window", "eval") ||
    isStaticMemberNamed(node, "globalThis", "eval")
  );
}

function isFunctionConstructorCallee(node: TSESTree.Node): boolean {
  return (
    isIdentifierNamed(node, "Function") || isGlobalMemberNamed(node, "Function")
  );
}

function isTimerCallee(node: TSESTree.Node): boolean {
  return (
    isIdentifierNamed(node, "setTimeout") ||
    isIdentifierNamed(node, "setInterval")
  );
}

function isStringLikeNode(node: TSESTree.Node): boolean {
  return (
    (node.type === AST_NODE_TYPES.Literal && typeof node.value === "string") ||
    node.type === AST_NODE_TYPES.TemplateLiteral
  );
}

function isStringTimerCall(node: TSESTree.CallExpression): boolean {
  if (!isTimerCallee(node.callee)) {
    return false;
  }

  const [callback] = node.arguments;
  if (!callback || callback.type === AST_NODE_TYPES.SpreadElement) {
    return false;
  }

  return isStringLikeNode(callback);
}

export default createRule<[], MessageIds>({
  name: "no-dynamic-code-execution",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow dynamic code execution through eval, Function constructors, and string-based timers",
    },
    messages: {
      noDynamicCodeExecution: [
        "Do not execute strings as code.",
        "",
        "Why: Dynamic execution APIs such as eval, Function constructors, and string-based timers turn strings into executable code. LLMs often reach for them when implementing flexible dispatch, expression evaluation, or plugin/config behavior, but they create injection risks and hide the valid command surface from reviewers.",
        "",
        "How to fix:",
        "  Use an explicit dispatch table, schema/config parsing, or reviewed plugin registration instead of compiling strings.",
        "  Before: eval(action)",
        "  After:  handlers[action]?.()",
        '  Before: setTimeout("refreshToken()", 1000)',
        "  After:  setTimeout(() => refreshToken(), 1000)",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (
          isEvalCallee(node.callee) ||
          isFunctionConstructorCallee(node.callee) ||
          isStringTimerCall(node)
        ) {
          context.report({
            node,
            messageId: "noDynamicCodeExecution",
          });
        }
      },

      NewExpression(node: TSESTree.NewExpression) {
        if (!isFunctionConstructorCallee(node.callee)) {
          return;
        }

        context.report({
          node,
          messageId: "noDynamicCodeExecution",
        });
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Do not execute strings as code with eval, Function constructors, or string timers; use explicit dispatch tables or callbacks instead",
};
