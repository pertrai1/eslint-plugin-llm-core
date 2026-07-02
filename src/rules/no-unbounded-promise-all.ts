import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "noUnboundedPromiseAll";

type ScopeLike = {
  set: Map<string, VariableLike>;
  upper: ScopeLike | null;
};

type VariableLike = {
  defs: Array<{ node: TSESTree.Node }>;
};

type SourceCodeWithScope = {
  getScope(node: TSESTree.Node): unknown;
};

const PROMISE_COMBINATORS = new Set(["all", "allSettled"]);
const LIMITER_NAMES = new Set([
  "limit",
  "limiter",
  "concurrency",
  "throttle",
  "pool",
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

function isPromiseCombinatorCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return false;

  const callee = node.callee;
  return (
    callee.object.type === AST_NODE_TYPES.Identifier &&
    callee.object.name === "Promise" &&
    PROMISE_COMBINATORS.has(getStaticPropertyName(callee) ?? "")
  );
}

function isArrayFromLengthObject(node: TSESTree.Node): boolean {
  if (node.type !== AST_NODE_TYPES.CallExpression) return false;
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return false;

  const callee = node.callee;
  if (
    callee.object.type !== AST_NODE_TYPES.Identifier ||
    callee.object.name !== "Array" ||
    getStaticPropertyName(callee) !== "from"
  ) {
    return false;
  }

  const [source] = node.arguments;
  return (
    source?.type === AST_NODE_TYPES.ObjectExpression &&
    source.properties.some(
      (property) =>
        property.type === AST_NODE_TYPES.Property &&
        !property.computed &&
        ((property.key.type === AST_NODE_TYPES.Identifier &&
          property.key.name === "length") ||
          (property.key.type === AST_NODE_TYPES.Literal &&
            property.key.value === "length")),
    )
  );
}

function unwrapCallbackBody(
  callback: TSESTree.CallExpressionArgument | undefined,
): TSESTree.Node | undefined {
  if (callback?.type === AST_NODE_TYPES.ArrowFunctionExpression) {
    return callback.body;
  }

  if (callback?.type === AST_NODE_TYPES.FunctionExpression) {
    return callback.body;
  }

  return undefined;
}

function isLimiterCall(node: TSESTree.Node | undefined): boolean {
  if (!node) return false;

  if (node.type === AST_NODE_TYPES.CallExpression) {
    return (
      node.callee.type === AST_NODE_TYPES.Identifier &&
      LIMITER_NAMES.has(node.callee.name)
    );
  }

  if (node.type !== AST_NODE_TYPES.BlockStatement) return false;

  return node.body.some(
    (statement) =>
      statement.type === AST_NODE_TYPES.ReturnStatement &&
      isLimiterCall(statement.argument ?? undefined),
  );
}

function isForOfLoopVariable(identifier: TSESTree.Identifier): boolean {
  let current: TSESTree.Node | undefined = identifier.parent;

  while (current) {
    if (current.type === AST_NODE_TYPES.ForOfStatement) {
      const left = current.left;
      if (
        left.type === AST_NODE_TYPES.VariableDeclaration &&
        left.declarations.some(
          (declaration) =>
            declaration.id.type === AST_NODE_TYPES.Identifier &&
            declaration.id.name === identifier.name,
        )
      ) {
        return true;
      }

      return (
        left.type === AST_NODE_TYPES.Identifier && left.name === identifier.name
      );
    }

    current = current.parent;
  }

  return false;
}

function isBoundedMapSource(node: TSESTree.Node): boolean {
  if (node.type === AST_NODE_TYPES.ArrayExpression) return true;
  if (isArrayFromLengthObject(node)) return true;
  if (node.type === AST_NODE_TYPES.Identifier && isForOfLoopVariable(node)) {
    return true;
  }

  return false;
}

function isMapCall(node: TSESTree.Node): node is TSESTree.CallExpression {
  return (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    getStaticPropertyName(node.callee) === "map"
  );
}

function isUnboundedMapCall(node: TSESTree.Node): boolean {
  if (!isMapCall(node)) return false;
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return false;

  const source = node.callee.object;
  if (isBoundedMapSource(source)) return false;

  const callbackBody = unwrapCallbackBody(node.arguments[0]);
  return !isLimiterCall(callbackBody);
}

function findVariable(
  scope: ScopeLike,
  name: string,
): VariableLike | undefined {
  let current: ScopeLike | null = scope;

  while (current) {
    const variable = current.set.get(name);
    if (variable) return variable;
    current = current.upper;
  }

  return undefined;
}

function getVariableInit(
  sourceCode: SourceCodeWithScope,
  node: TSESTree.Node,
  identifier: TSESTree.Identifier,
): TSESTree.Expression | null {
  const variable = findVariable(
    sourceCode.getScope(node) as ScopeLike,
    identifier.name,
  );
  const definition = variable?.defs[0];

  if (definition?.node.type !== AST_NODE_TYPES.VariableDeclarator) {
    return null;
  }

  return definition.node.init;
}

export default createRule<[], MessageIds>({
  name: "no-unbounded-promise-all",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Promise.all fan-out over arbitrary collections without an explicit concurrency bound",
    },
    messages: {
      noUnboundedPromiseAll: [
        "Avoid unbounded Promise fan-out over a collection.",
        "",
        "Why: Promise.all(collection.map(...)) starts work for every item at once. LLM-generated code often uses this as a speed shortcut, but large inputs can exhaust memory, overload APIs, or drain database pools.",
        "",
        "How to fix:",
        "  Before: await Promise.all(users.map((user) => sendEmail(user)));",
        "  After:  const limit = pLimit(5); await Promise.all(users.map((user) => limit(() => sendEmail(user))));",
        "  Or batch work explicitly: for (const batch of chunks(users, 10)) { await Promise.all(batch.map(sendEmail)); }",
        "  Or use a for...of loop when sequential backpressure is intended.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function isUnboundedPromiseArgument(argument: TSESTree.Node): boolean {
      if (isUnboundedMapCall(argument)) return true;

      if (argument.type !== AST_NODE_TYPES.Identifier) return false;

      const init = getVariableInit(context.sourceCode, argument, argument);
      return init ? isUnboundedMapCall(init) : false;
    }

    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (!isPromiseCombinatorCall(node)) return;

        const [argument] = node.arguments;
        if (!argument || argument.type === AST_NODE_TYPES.SpreadElement) return;

        if (!isUnboundedPromiseArgument(argument)) return;

        context.report({
          node,
          messageId: "noUnboundedPromiseAll",
        });
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Bound concurrency for Promise.all over collections; use p-limit, batching, or sequential loops instead of unbounded fan-out",
};
