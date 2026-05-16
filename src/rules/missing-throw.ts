import { AST_NODE_TYPES, TSESLint, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "missingThrow";

const ERROR_CONSTRUCTORS = new Set([
  "AggregateError",
  "Error",
  "EvalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError",
]);

function isGlobalBuiltinConstructor(
  sourceCode: Readonly<TSESLint.SourceCode>,
  callee: TSESTree.Identifier,
): boolean {
  let scope: ReturnType<TSESLint.SourceCode["getScope"]> | null =
    sourceCode.getScope(callee);

  while (scope) {
    const variable = scope.variables.find(({ name }) => name === callee.name);

    if (variable) {
      return variable.defs.length === 0;
    }

    scope = scope.upper;
  }

  return true;
}

function getExpressionStatement(
  node: TSESTree.NewExpression,
): TSESTree.ExpressionStatement | undefined {
  let current: TSESTree.Node = node;
  let parent = node.parent;

  while (
    parent.type === AST_NODE_TYPES.TSAsExpression ||
    parent.type === AST_NODE_TYPES.TSNonNullExpression ||
    parent.type === AST_NODE_TYPES.TSSatisfiesExpression ||
    parent.type === AST_NODE_TYPES.TSTypeAssertion
  ) {
    current = parent;
    parent = parent.parent;
  }

  if (
    parent.type === AST_NODE_TYPES.ExpressionStatement &&
    parent.expression === current
  ) {
    return parent;
  }

  return undefined;
}

export default createRule<[], MessageIds>({
  name: "missing-throw",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow standalone new Error expressions that likely forgot the throw keyword",
    },
    messages: {
      missingThrow: [
        "This Error object is constructed but never thrown.",
        "",
        "Why: `new Error(...)` by itself only creates an Error object. It does not stop execution, reject a request, or enter surrounding catch handlers. LLMs often generate this in guard clauses when they meant to fail fast, leaving the invalid path to continue silently.",
        "",
        "How to fix:",
        "  Before: new Error('User not found');",
        "  After:  throw new Error('User not found');",
        "",
        "If you intended to return an Error object, return it explicitly:",
        "  return new Error('User not found');",
      ].join("\n"),
    },
    fixable: "code",
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      NewExpression(node: TSESTree.NewExpression) {
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          !ERROR_CONSTRUCTORS.has(node.callee.name)
        ) {
          return;
        }

        if (!isGlobalBuiltinConstructor(sourceCode, node.callee)) {
          return;
        }

        if (!getExpressionStatement(node)) {
          return;
        }

        context.report({
          node,
          messageId: "missingThrow",
          fix(fixer) {
            return fixer.insertTextBefore(node, "throw ");
          },
        });
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Throw Error objects when failing fast — standalone new Error(...) does nothing",
};
