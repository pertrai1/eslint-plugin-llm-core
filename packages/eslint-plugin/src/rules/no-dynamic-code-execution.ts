import { AST_NODE_TYPES, TSESLint, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "noDynamicCodeExecution";

type SourceCode = Readonly<TSESLint.SourceCode>;

function isIdentifierNamed(
  node: TSESTree.Node,
  name: string,
): node is TSESTree.Identifier {
  return node.type === AST_NODE_TYPES.Identifier && node.name === name;
}

function isGlobalObjectName(name: string): boolean {
  return name === "window" || name === "globalThis";
}

function isReferenceToGlobal(
  sourceCode: SourceCode,
  id: TSESTree.Identifier,
): boolean {
  let scope: TSESLint.Scope.Scope | null = sourceCode.getScope(id);

  while (scope) {
    const variable = scope.variables.find(({ name }) => name === id.name);

    if (variable) {
      return variable.defs.length === 0;
    }

    scope = scope.upper;
  }

  return true;
}

function isGlobalIdentifierNamed(
  sourceCode: SourceCode,
  node: TSESTree.Node,
  name: string,
): node is TSESTree.Identifier {
  return isIdentifierNamed(node, name) && isReferenceToGlobal(sourceCode, node);
}

function isStaticGlobalMemberNamed(
  sourceCode: SourceCode,
  node: TSESTree.Node,
  objectName: string,
  propertyName: string,
): node is TSESTree.MemberExpression {
  return (
    node.type === AST_NODE_TYPES.MemberExpression &&
    !node.computed &&
    isGlobalIdentifierNamed(sourceCode, node.object, objectName) &&
    isIdentifierNamed(node.property, propertyName)
  );
}

function isGlobalMemberNamed(
  sourceCode: SourceCode,
  node: TSESTree.Node,
  propertyName: string,
): boolean {
  return (
    node.type === AST_NODE_TYPES.MemberExpression &&
    !node.computed &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    isGlobalObjectName(node.object.name) &&
    isReferenceToGlobal(sourceCode, node.object) &&
    isIdentifierNamed(node.property, propertyName)
  );
}

function isEvalCallee(sourceCode: SourceCode, node: TSESTree.Node): boolean {
  return (
    isGlobalIdentifierNamed(sourceCode, node, "eval") ||
    isStaticGlobalMemberNamed(sourceCode, node, "window", "eval") ||
    isStaticGlobalMemberNamed(sourceCode, node, "globalThis", "eval")
  );
}

function isFunctionConstructorCallee(
  sourceCode: SourceCode,
  node: TSESTree.Node,
): boolean {
  return (
    isGlobalIdentifierNamed(sourceCode, node, "Function") ||
    isGlobalMemberNamed(sourceCode, node, "Function")
  );
}

function isTimerCallee(sourceCode: SourceCode, node: TSESTree.Node): boolean {
  return (
    isGlobalIdentifierNamed(sourceCode, node, "setTimeout") ||
    isGlobalIdentifierNamed(sourceCode, node, "setInterval") ||
    isGlobalMemberNamed(sourceCode, node, "setTimeout") ||
    isGlobalMemberNamed(sourceCode, node, "setInterval")
  );
}

function isStringLikeNode(node: TSESTree.Node): boolean {
  return (
    (node.type === AST_NODE_TYPES.Literal && typeof node.value === "string") ||
    node.type === AST_NODE_TYPES.TemplateLiteral
  );
}

function isStringTimerCall(
  sourceCode: SourceCode,
  node: TSESTree.CallExpression,
): boolean {
  if (!isTimerCallee(sourceCode, node.callee)) {
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
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (
          isEvalCallee(sourceCode, node.callee) ||
          isFunctionConstructorCallee(sourceCode, node.callee) ||
          isStringTimerCall(sourceCode, node)
        ) {
          context.report({
            node,
            messageId: "noDynamicCodeExecution",
          });
        }
      },

      NewExpression(node: TSESTree.NewExpression) {
        if (!isFunctionConstructorCallee(sourceCode, node.callee)) {
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
