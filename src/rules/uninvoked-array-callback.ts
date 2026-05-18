import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "uninvokedArrayCallback";

const CALLBACK_ARRAY_METHODS = new Set([
  "every",
  "filter",
  "find",
  "findIndex",
  "findLast",
  "findLastIndex",
  "flatMap",
  "forEach",
  "map",
  "reduce",
  "reduceRight",
  "some",
]);

function getStaticPropertyName(
  member: TSESTree.MemberExpression,
): string | undefined {
  if (!member.computed && member.property.type === AST_NODE_TYPES.Identifier) {
    return member.property.name;
  }

  if (
    member.computed &&
    member.property.type === AST_NODE_TYPES.Literal &&
    typeof member.property.value === "string"
  ) {
    return member.property.value;
  }

  return undefined;
}

function isSingleLengthArrayArgument(
  argument: TSESTree.CallExpressionArgument,
): boolean {
  if (argument.type === AST_NODE_TYPES.SpreadElement) {
    return false;
  }

  return !(
    argument.type === AST_NODE_TYPES.Literal &&
    typeof argument.value === "string"
  );
}

function isSparseArrayConstructorCall(node: TSESTree.Node): boolean {
  if (node.type === AST_NODE_TYPES.NewExpression) {
    return (
      node.callee.type === AST_NODE_TYPES.Identifier &&
      node.callee.name === "Array" &&
      node.arguments.length === 1 &&
      isSingleLengthArrayArgument(node.arguments[0])
    );
  }

  if (node.type === AST_NODE_TYPES.CallExpression) {
    return (
      node.callee.type === AST_NODE_TYPES.Identifier &&
      node.callee.name === "Array" &&
      node.arguments.length === 1 &&
      isSingleLengthArrayArgument(node.arguments[0])
    );
  }

  return false;
}

function isFilledArrayCall(node: TSESTree.Node): boolean {
  if (node.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }

  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }

  return (
    getStaticPropertyName(node.callee) === "fill" &&
    isSparseArrayConstructorCall(node.callee.object)
  );
}

function isSparseArrayCallbackCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }

  const methodName = getStaticPropertyName(node.callee);
  if (!methodName || !CALLBACK_ARRAY_METHODS.has(methodName)) {
    return false;
  }

  const object = node.callee.object;

  if (isFilledArrayCall(object)) {
    return false;
  }

  return isSparseArrayConstructorCall(object);
}

export default createRule<[], MessageIds>({
  name: "uninvoked-array-callback",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow callbacks on sparse arrays created with Array(length) because holes skip callback invocation",
    },
    messages: {
      uninvokedArrayCallback: [
        "This array callback will not run for the sparse slots created by Array(length).",
        "",
        "Why: `Array(length)` and `new Array(length)` create holes, not real elements. Methods like map, filter, forEach, some, and every skip holes, so LLM-generated code that expects one callback per index silently returns the wrong result.",
        "",
        "How to fix:",
        "  Prefer Array.from({ length }, (_, index) => createItem(index));",
        "  Or materialize elements first: new Array(length).fill(null).map((_, index) => createItem(index));",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (!isSparseArrayCallbackCall(node)) {
          return;
        }

        context.report({
          node,
          messageId: "uninvokedArrayCallback",
        });
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Don't call array callbacks on sparse Array(length) values; materialize elements first",
};
