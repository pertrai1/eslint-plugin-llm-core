import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "noAsyncPromiseExecutor";

function isAsyncFunction(
  node: TSESTree.Node,
): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression {
  return (
    (node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      node.type === AST_NODE_TYPES.FunctionExpression) &&
    node.async
  );
}

function isPromiseConstructor(node: TSESTree.NewExpression): boolean {
  return (
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === "Promise"
  );
}

export default createRule<[], MessageIds>({
  name: "no-async-promise-executor",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow async Promise executor functions because thrown errors are not captured by the outer Promise",
    },
    messages: {
      noAsyncPromiseExecutor: [
        "Do not use an async function as a Promise executor.",
        "",
        "Why: The Promise constructor does not await async executors, so thrown errors can be lost instead of rejecting the outer Promise.",
        "",
        "How to fix:",
        "  Before: new Promise(async (resolve) => { resolve(await loadValue()); })",
        "  After:  loadValue()",
        "  If you need manual wrapping, keep the executor synchronous and call resolve/reject from callbacks.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      NewExpression(node: TSESTree.NewExpression) {
        if (!isPromiseConstructor(node)) {
          return;
        }

        const [executor] = node.arguments;
        if (!executor || executor.type === AST_NODE_TYPES.SpreadElement) {
          return;
        }

        if (!isAsyncFunction(executor)) {
          return;
        }

        context.report({
          node: executor,
          messageId: "noAsyncPromiseExecutor",
        });
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Do not use async Promise executors; return the async operation directly or keep executor callbacks synchronous",
};
