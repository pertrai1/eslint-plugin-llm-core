import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds = "noAsyncForeach";

export default createRule<[], MessageIds>({
  name: "no-async-foreach",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow passing async functions to Array.prototype.forEach",
    },
    messages: {
      noAsyncForeach: [
        "Do not pass an async function to .forEach() — the returned Promises are silently discarded.",
        "",
        "Why: Array.prototype.forEach ignores the return value of its callback.",
        "When the callback is async, each call returns a Promise that is never awaited.",
        "This means errors are swallowed, execution order is unpredictable,",
        "and the code after forEach runs before any of the callbacks complete.",
        "",
        "How to fix:",
        "  Before: items.forEach(async (item) => {",
        "            await processItem(item);",
        "          });",
        "",
        "  Sequential: for (const item of items) {",
        "                await processItem(item);",
        "              }",
        "",
        "  Parallel:   await Promise.all(items.map(async (item) => {",
        "                await processItem(item);",
        "              }));",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (
          node.callee.type !== AST_NODE_TYPES.MemberExpression ||
          node.callee.property.type !== AST_NODE_TYPES.Identifier ||
          node.callee.property.name !== "forEach"
        ) {
          return;
        }

        const callback = node.arguments[0];
        if (!callback) return;

        if (
          (callback.type === AST_NODE_TYPES.ArrowFunctionExpression ||
            callback.type === AST_NODE_TYPES.FunctionExpression) &&
          callback.async
        ) {
          context.report({
            node: callback,
            messageId: "noAsyncForeach",
          });
        }
      },
    };
  },
});
