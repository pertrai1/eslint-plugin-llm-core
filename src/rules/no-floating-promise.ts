import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "noFloatingPromise";

export default createRule<[], MessageIds>({
  name: "no-floating-promise",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow calling async functions or Promise-returning expressions without awaiting, returning, or explicitly voiding the result",
    },
    messages: {
      noFloatingPromise: [
        "Unhandled Promise at statement position — the returned Promise is discarded.",
        "",
        "Why: Dropping a Promise loses its rejection, breaks execution ordering, and is one of the most common async bugs in LLM-generated code.",
        "",
        "How to fix:",
        "  Choose one explicit outcome:",
        "  Before: saveData();",
        "  After:  await saveData();",
        "  Or:     return saveData();",
        "  Or:     void saveData();  // explicit fire-and-forget",
        "  Or:     saveData().catch((error) => logger.error('save failed', error));",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const PROMISE_FACTORY_METHODS = new Set([
      "all",
      "allSettled",
      "race",
      "any",
      "resolve",
      "reject",
    ]);

    function isAsyncFunctionReference(callee: TSESTree.Expression): boolean {
      if (callee.type !== AST_NODE_TYPES.Identifier) return false;
      const scope = context.sourceCode.getScope(callee);
      const variable = scope.references.find(
        (ref) => ref.identifier === callee,
      )?.resolved;
      if (!variable) return false;
      return variable.defs.some((def) => {
        const node = def.node;
        if (
          node.type === AST_NODE_TYPES.FunctionDeclaration &&
          node.async === true
        ) {
          return true;
        }
        if (node.type === AST_NODE_TYPES.VariableDeclarator) {
          const init = node.init;
          return (
            init !== null &&
            init !== undefined &&
            (init.type === AST_NODE_TYPES.ArrowFunctionExpression ||
              init.type === AST_NODE_TYPES.FunctionExpression) &&
            init.async === true
          );
        }
        return false;
      });
    }

    function isPromiseFactoryCall(callee: TSESTree.Expression): boolean {
      if (callee.type !== AST_NODE_TYPES.MemberExpression) return false;
      if (
        callee.object.type !== AST_NODE_TYPES.Identifier ||
        callee.object.name !== "Promise"
      ) {
        return false;
      }
      if (callee.property.type !== AST_NODE_TYPES.Identifier) return false;
      return PROMISE_FACTORY_METHODS.has(callee.property.name);
    }

    return {
      ExpressionStatement(node: TSESTree.ExpressionStatement) {
        const expr = node.expression;
        if (expr.type !== AST_NODE_TYPES.CallExpression) return;
        const callee = expr.callee as TSESTree.Expression;
        if (
          !isAsyncFunctionReference(callee) &&
          !isPromiseFactoryCall(callee)
        ) {
          return;
        }
        context.report({
          node: expr,
          messageId: "noFloatingPromise",
        });
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Always await, return, void, or chain .catch() on Promise-returning calls",
};
