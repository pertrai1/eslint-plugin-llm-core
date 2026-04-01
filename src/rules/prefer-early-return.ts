import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds = "preferEarlyReturn";

type Options = [
  {
    minBodyStatements?: number;
  },
];

function isReturnOrThrow(node: TSESTree.Statement): boolean {
  return (
    node.type === AST_NODE_TYPES.ReturnStatement ||
    node.type === AST_NODE_TYPES.ThrowStatement
  );
}

function isShortElse(alternate: TSESTree.Statement): boolean {
  // Direct return/throw: else throw new Error(...)
  if (isReturnOrThrow(alternate)) return true;

  // Block with single return/throw: else { return null; }
  if (
    alternate.type === AST_NODE_TYPES.BlockStatement &&
    alternate.body.length === 1 &&
    isReturnOrThrow(alternate.body[0])
  ) {
    return true;
  }

  return false;
}

function getConsequentStatementCount(
  consequent: TSESTree.Statement,
): number | null {
  if (consequent.type === AST_NODE_TYPES.BlockStatement) {
    return consequent.body.length;
  }
  // Non-block consequent (e.g., `if (x) doSomething()`) counts as 1
  return 1;
}

export default createRule<Options, MessageIds>({
  name: "prefer-early-return",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce guard clauses (early returns) instead of wrapping function bodies in a single if statement",
    },
    messages: {
      preferEarlyReturn: [
        "This function body is wrapped in a single 'if' statement. Use a guard clause (early return) instead.",
        "",
        "Why: Wrapping the entire function body in an 'if' adds unnecessary nesting",
        "and obscures the main logic. Guard clauses handle edge cases at the top,",
        'leaving the "happy path" at the base indentation level.',
        "",
        "How to fix:",
        "  Before: function process(data) {",
        "            if (isValid(data)) {",
        "              transform(data);",
        "              save(data);",
        "            }",
        "          }",
        "  After:  function process(data) {",
        "            if (!isValid(data)) return;",
        "            transform(data);",
        "            save(data);",
        "          }",
      ].join("\n"),
    },
    schema: [
      {
        type: "object",
        properties: {
          minBodyStatements: {
            type: "integer",
            minimum: 1,
            description:
              "Minimum number of statements in the if body to trigger the rule (default: 2)",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const minBodyStatements = options.minBodyStatements ?? 2;

    function checkFunction(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression,
    ) {
      // Arrow functions with expression bodies have no block to check
      const body = node.body;
      if (body.type !== AST_NODE_TYPES.BlockStatement) return;

      // Function body must have exactly one statement
      if (body.body.length !== 1) return;

      const onlyStatement = body.body[0];
      if (onlyStatement.type !== AST_NODE_TYPES.IfStatement) return;

      const ifStatement = onlyStatement;

      // Check consequent has enough statements to warrant a guard clause
      const statementCount = getConsequentStatementCount(
        ifStatement.consequent,
      );
      if (statementCount === null || statementCount < minBodyStatements) return;

      // No else — implicit return, should use guard clause
      if (!ifStatement.alternate) {
        context.report({
          node: ifStatement,
          messageId: "preferEarlyReturn",
        });
        return;
      }

      // Short else (single return/throw) — should invert to guard clause
      if (isShortElse(ifStatement.alternate)) {
        context.report({
          node: ifStatement,
          messageId: "preferEarlyReturn",
        });
        return;
      }

      // Complex else — don't flag, both branches have meaningful logic
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
});
