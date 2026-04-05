import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds = "noAsyncArrayCallback" | "noAsyncMapCallback";

// Array methods where async callbacks are almost always a bug — the return
// value of the callback is either ignored or used in a boolean/accumulator
// context that doesn't understand Promises.
const ALWAYS_FLAGGED_METHODS = new Set([
  "forEach",
  "filter",
  "some",
  "every",
  "reduce",
  "flatMap",
]);

export default createRule<[], MessageIds>({
  name: "no-async-array-callbacks",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow async callbacks passed to array methods where Promises are silently discarded or misused",
    },
    messages: {
      noAsyncArrayCallback: [
        "Do not pass an async function to .{{ method }}() because this method does not await callback results.",
        "",
        "Why: `{{ method }}` expects a synchronous callback, so `async` changes the meaning of the code.",
        "",
        "How to fix:",
        "  Before: items.{{ method }}(async (item) => { await processItem(item); });",
        "  After:  for (const item of items) { await processItem(item); }",
        "  If you need parallel work, use: await Promise.all(items.map(async (item) => processItem(item)));",
      ].join("\n"),

      noAsyncMapCallback: [
        "Do not pass an async function to .map() unless you immediately await or return the resulting Promise array through a Promise combinator.",
        "",
        "Why: .map(async ...) returns Promise[]; without immediate consumption, the work starts but the result is never handled.",
        "",
        "How to fix:",
        "  Before: const results = items.map(async (item) => processItem(item));",
        "  After:  const results = await Promise.all(items.map(async (item) => processItem(item)));",
        "  If you need sequential work instead, use for...of and push awaited results one item at a time.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function isAsyncCallback(node: TSESTree.Node): boolean {
      return (
        (node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
          node.type === AST_NODE_TYPES.FunctionExpression) &&
        (node as TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression)
          .async
      );
    }

    function isPromiseCombinatorCall(
      node: TSESTree.Node,
    ): node is TSESTree.CallExpression {
      if (node.type !== AST_NODE_TYPES.CallExpression) return false;

      if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return false;
      const callee = node.callee;
      if (
        callee.object.type !== AST_NODE_TYPES.Identifier ||
        callee.object.name !== "Promise"
      ) {
        return false;
      }

      if (callee.property.type !== AST_NODE_TYPES.Identifier) return false;

      const method = callee.property.name;
      return (
        method === "all" ||
        method === "allSettled" ||
        method === "race" ||
        method === "any"
      );
    }

    // Returns true when the .map(...) call is passed directly to a Promise
    // combinator (all, allSettled, race, any) and that outer promise is
    // immediately awaited or returned.
    function isSafelyConsumedMapResult(
      mapCall: TSESTree.CallExpression,
    ): boolean {
      const parent = mapCall.parent;
      if (!parent || !isPromiseCombinatorCall(parent)) return false;

      const outer = parent;
      if (!outer.arguments.includes(mapCall as TSESTree.Expression)) {
        return false;
      }

      const outerParent = outer.parent;
      if (!outerParent) return false;

      if (outerParent.type === AST_NODE_TYPES.AwaitExpression) {
        return true;
      }

      if (outerParent.type === AST_NODE_TYPES.ReturnStatement) {
        return outerParent.argument === outer;
      }

      return false;
    }

    // Async map calls stored in const variables. These are deferred until
    // scope exit so we can check if the variable is later passed to a
    // Promise combinator (all, allSettled, race, any) and awaited/returned.
    const deferredMapCalls: {
      variableName: string;
      callback: TSESTree.Node;
      declarator: TSESTree.VariableDeclarator;
    }[] = [];

    function isDeferredSafelyConsumed(
      declarator: TSESTree.VariableDeclarator,
      variableName: string,
    ): boolean {
      const scope = context.sourceCode.getScope(declarator);
      const variable = scope.variables.find((v) => v.name === variableName);
      if (!variable) return false;

      return variable.references.some((ref) => {
        if (ref.isWriteOnly()) return false;
        const refParent = ref.identifier.parent;
        if (!refParent || !isPromiseCombinatorCall(refParent)) return false;
        if (
          !refParent.arguments.includes(ref.identifier as TSESTree.Expression)
        ) {
          return false;
        }
        const outerParent = refParent.parent;
        if (!outerParent) return false;
        if (outerParent.type === AST_NODE_TYPES.AwaitExpression) return true;
        if (
          outerParent.type === AST_NODE_TYPES.ReturnStatement &&
          outerParent.argument === refParent
        ) {
          return true;
        }
        return false;
      });
    }

    function reportDeferredMapCalls(): void {
      for (const { variableName, callback, declarator } of deferredMapCalls) {
        if (!isDeferredSafelyConsumed(declarator, variableName)) {
          context.report({
            node: callback,
            messageId: "noAsyncMapCallback",
          });
        }
      }
    }

    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return;
        const prop = node.callee.property;
        if (prop.type !== AST_NODE_TYPES.Identifier) return;
        const methodName = prop.name;

        const callback = node.arguments[0];
        if (!callback) return;
        if (!isAsyncCallback(callback)) return;

        if (ALWAYS_FLAGGED_METHODS.has(methodName)) {
          context.report({
            node: callback,
            messageId: "noAsyncArrayCallback",
            data: { method: methodName },
          });
          return;
        }

        if (methodName === "map" && !isSafelyConsumedMapResult(node)) {
          // Check if stored in a const — defer reporting until scope exit
          const parent = node.parent;
          if (
            parent?.type === AST_NODE_TYPES.VariableDeclarator &&
            parent.parent?.type === AST_NODE_TYPES.VariableDeclaration &&
            parent.parent.kind === "const" &&
            parent.id.type === AST_NODE_TYPES.Identifier
          ) {
            deferredMapCalls.push({
              variableName: parent.id.name,
              callback,
              declarator: parent,
            });
            return;
          }

          context.report({
            node: callback,
            messageId: "noAsyncMapCallback",
          });
        }
      },

      "Program:exit": reportDeferredMapCalls,
    };
  },
});
