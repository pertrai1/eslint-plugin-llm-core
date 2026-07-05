import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "unsafeArrayAccess";

type ArrayPatternElement = NonNullable<
  TSESTree.ArrayPattern["elements"][number]
>;

function unwrapTransparentExpression(node: TSESTree.Node): TSESTree.Node {
  let current = node;

  while (
    current.type === AST_NODE_TYPES.ChainExpression ||
    current.type === AST_NODE_TYPES.TSAsExpression ||
    current.type === AST_NODE_TYPES.TSNonNullExpression ||
    current.type === AST_NODE_TYPES.TSSatisfiesExpression ||
    current.type === AST_NODE_TYPES.TSTypeAssertion
  ) {
    current = current.expression;
  }

  return current;
}

function getIdentifierName(node: TSESTree.Node): string | null {
  const expression = unwrapTransparentExpression(node);
  return expression.type === AST_NODE_TYPES.Identifier ? expression.name : null;
}

function getLiteralNumber(node: TSESTree.Node): number | null {
  const expression = unwrapTransparentExpression(node);
  return expression.type === AST_NODE_TYPES.Literal &&
    typeof expression.value === "number"
    ? expression.value
    : null;
}

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

function isLengthAccess(node: TSESTree.Node, arrayName: string): boolean {
  const expression = unwrapTransparentExpression(node);
  if (expression.type !== AST_NODE_TYPES.MemberExpression) return false;

  return (
    getIdentifierName(expression.object) === arrayName &&
    getStaticPropertyName(expression) === "length"
  );
}

function isArrayLengthMinusOne(
  node: TSESTree.Node,
  arrayName: string,
): boolean {
  const expression = unwrapTransparentExpression(node);
  return (
    expression.type === AST_NODE_TYPES.BinaryExpression &&
    expression.operator === "-" &&
    isLengthAccess(expression.left, arrayName) &&
    getLiteralNumber(expression.right) === 1
  );
}

function getUnsafeIndexedArrayName(
  node: TSESTree.MemberExpression,
): string | null {
  if (node.optional || !node.computed) return null;

  const arrayName = getIdentifierName(node.object);
  if (!arrayName) return null;

  if (getLiteralNumber(node.property) === 0) return arrayName;
  if (isArrayLengthMinusOne(node.property, arrayName)) return arrayName;

  return null;
}

function isPositiveLengthGuard(
  node: TSESTree.Node | null | undefined,
  arrayName: string,
): boolean {
  if (!node) return false;

  const expression = unwrapTransparentExpression(node);

  if (isLengthAccess(expression, arrayName)) return true;

  if (
    expression.type === AST_NODE_TYPES.UnaryExpression &&
    expression.operator === "!"
  ) {
    return isEmptyLengthGuard(expression.argument, arrayName);
  }

  if (
    expression.type === AST_NODE_TYPES.BinaryExpression &&
    isLengthComparison(expression, arrayName, "non-empty")
  ) {
    return true;
  }

  return false;
}

function isEmptyLengthGuard(
  node: TSESTree.Node | null | undefined,
  arrayName: string,
): boolean {
  if (!node) return false;

  const expression = unwrapTransparentExpression(node);

  if (
    expression.type === AST_NODE_TYPES.UnaryExpression &&
    expression.operator === "!"
  ) {
    return isPositiveLengthGuard(expression.argument, arrayName);
  }

  if (
    expression.type === AST_NODE_TYPES.BinaryExpression &&
    isLengthComparison(expression, arrayName, "empty")
  ) {
    return true;
  }

  return false;
}

function isLengthComparison(
  node: TSESTree.BinaryExpression,
  arrayName: string,
  mode: "non-empty" | "empty",
): boolean {
  const leftIsLength = isLengthAccess(node.left, arrayName);
  const rightIsLength = isLengthAccess(node.right, arrayName);
  const leftNumber = getLiteralNumber(node.left);
  const rightNumber = getLiteralNumber(node.right);

  if (leftIsLength && rightNumber !== null) {
    return mode === "non-empty"
      ? isNonEmptyLengthComparison(node.operator, rightNumber)
      : isEmptyLengthComparison(node.operator, rightNumber);
  }

  if (rightIsLength && leftNumber !== null) {
    return mode === "non-empty"
      ? isNonEmptyReversedLengthComparison(node.operator, leftNumber)
      : isEmptyReversedLengthComparison(node.operator, leftNumber);
  }

  return false;
}

function isNonEmptyLengthComparison(
  operator: TSESTree.BinaryExpression["operator"],
  value: number,
): boolean {
  return (
    ((operator === ">" || operator === "!==" || operator === "!=") &&
      value === 0) ||
    (operator === ">=" && value === 1)
  );
}

function isNonEmptyReversedLengthComparison(
  operator: TSESTree.BinaryExpression["operator"],
  value: number,
): boolean {
  return (
    ((operator === "<" || operator === "!==" || operator === "!=") &&
      value === 0) ||
    (operator === "<=" && value === 1)
  );
}

function isEmptyLengthComparison(
  operator: TSESTree.BinaryExpression["operator"],
  value: number,
): boolean {
  return (
    ((operator === "===" || operator === "==" || operator === "<=") &&
      value === 0) ||
    (operator === "<" && value === 1)
  );
}

function isEmptyReversedLengthComparison(
  operator: TSESTree.BinaryExpression["operator"],
  value: number,
): boolean {
  return (
    ((operator === "===" || operator === "==" || operator === ">=") &&
      value === 0) ||
    (operator === ">" && value === 1)
  );
}

function statementSequenceAlwaysExits(
  statements: TSESTree.Statement[],
  fallbackStatements: TSESTree.Statement[] = [],
): boolean {
  const effectiveStatements =
    statements.length > 0 ? statements : fallbackStatements;

  return effectiveStatements.some(statementAlwaysExits);
}

function getNextNonEmptySwitchConsequent(
  cases: TSESTree.SwitchCase[],
  startIndex: number,
): TSESTree.Statement[] {
  return (
    cases
      .slice(startIndex + 1)
      .find((switchCase) => switchCase.consequent.length > 0)?.consequent ?? []
  );
}

function switchAlwaysExits(statement: TSESTree.SwitchStatement): boolean {
  return (
    statement.cases.length > 0 &&
    statement.cases.some((switchCase) => switchCase.test === null) &&
    statement.cases.every((switchCase, index) =>
      statementSequenceAlwaysExits(
        switchCase.consequent,
        getNextNonEmptySwitchConsequent(statement.cases, index),
      ),
    )
  );
}

function statementAlwaysExits(statement: TSESTree.Statement): boolean {
  if (
    statement.type === AST_NODE_TYPES.ReturnStatement ||
    statement.type === AST_NODE_TYPES.ThrowStatement
  ) {
    return true;
  }

  if (statement.type === AST_NODE_TYPES.BlockStatement) {
    return statementSequenceAlwaysExits(statement.body);
  }

  if (statement.type === AST_NODE_TYPES.IfStatement) {
    return Boolean(
      statement.alternate &&
      statementAlwaysExits(statement.consequent) &&
      statementAlwaysExits(statement.alternate),
    );
  }

  if (statement.type === AST_NODE_TYPES.SwitchStatement) {
    return switchAlwaysExits(statement);
  }

  return false;
}

function isFunctionBoundary(node: TSESTree.Node): boolean {
  return (
    node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression
  );
}

function isEarlyEmptyExit(
  statement: TSESTree.Statement,
  arrayName: string,
): boolean {
  if (statement.type !== AST_NODE_TYPES.IfStatement) return false;

  if (
    isEmptyLengthGuard(statement.test, arrayName) &&
    statementAlwaysExits(statement.consequent)
  ) {
    return true;
  }

  return Boolean(
    statement.alternate &&
    isPositiveLengthGuard(statement.test, arrayName) &&
    statementAlwaysExits(statement.alternate),
  );
}

function getEnclosingStatement(node: TSESTree.Node): TSESTree.Statement | null {
  let current: TSESTree.Node | undefined = node;

  while (current) {
    const parent: TSESTree.Node | undefined = current.parent;
    if (!parent || isFunctionBoundary(parent)) return null;

    if (
      (parent.type === AST_NODE_TYPES.BlockStatement ||
        parent.type === AST_NODE_TYPES.Program) &&
      parent.body.includes(current as TSESTree.Statement)
    ) {
      return current as TSESTree.Statement;
    }

    current = parent;
  }

  return null;
}

function hasEarlierEmptyExitInBlock(
  block: TSESTree.BlockStatement | TSESTree.Program,
  statement: TSESTree.Statement,
  arrayName: string,
): boolean {
  const statementIndex = block.body.indexOf(statement);
  if (statementIndex <= 0) return false;

  return block.body
    .slice(0, statementIndex)
    .some((previousStatement) =>
      isEarlyEmptyExit(previousStatement, arrayName),
    );
}

function hasPreviousEarlyExitGuard(
  node: TSESTree.Node,
  arrayName: string,
): boolean {
  let statement = getEnclosingStatement(node);

  while (statement) {
    const parent = statement.parent;
    if (
      !parent ||
      (parent.type !== AST_NODE_TYPES.BlockStatement &&
        parent.type !== AST_NODE_TYPES.Program)
    ) {
      return false;
    }

    if (hasEarlierEmptyExitInBlock(parent, statement, arrayName)) {
      return true;
    }

    if (parent.type === AST_NODE_TYPES.Program) return false;

    const container = parent.parent;
    if (!container || isFunctionBoundary(container)) return false;

    statement = getEnclosingStatement(container);
  }

  return false;
}

function hasControlFlowGuard(node: TSESTree.Node, arrayName: string): boolean {
  let current: TSESTree.Node = node;
  let parent: TSESTree.Node | undefined = current.parent;

  while (parent) {
    if (isFunctionBoundary(parent)) return false;

    if (parent.type === AST_NODE_TYPES.IfStatement) {
      if (
        current === parent.consequent &&
        isPositiveLengthGuard(parent.test, arrayName)
      ) {
        return true;
      }

      if (
        current === parent.alternate &&
        isEmptyLengthGuard(parent.test, arrayName)
      ) {
        return true;
      }
    }

    if (parent.type === AST_NODE_TYPES.ConditionalExpression) {
      if (
        current === parent.consequent &&
        isPositiveLengthGuard(parent.test, arrayName)
      ) {
        return true;
      }

      if (
        current === parent.alternate &&
        isEmptyLengthGuard(parent.test, arrayName)
      ) {
        return true;
      }
    }

    if (
      parent.type === AST_NODE_TYPES.LogicalExpression &&
      current === parent.right
    ) {
      if (
        parent.operator === "&&" &&
        isPositiveLengthGuard(parent.left, arrayName)
      ) {
        return true;
      }

      if (
        parent.operator === "||" &&
        isEmptyLengthGuard(parent.left, arrayName)
      ) {
        return true;
      }
    }

    current = parent;
    parent = current.parent;
  }

  return false;
}

function isGuarded(node: TSESTree.Node, arrayName: string): boolean {
  return (
    hasControlFlowGuard(node, arrayName) ||
    hasPreviousEarlyExitGuard(node, arrayName)
  );
}

function requiredElementNeedsGuard(element: ArrayPatternElement): boolean {
  return (
    element.type !== AST_NODE_TYPES.RestElement &&
    element.type !== AST_NODE_TYPES.AssignmentPattern
  );
}

export default createRule<[], MessageIds>({
  name: "no-unsafe-array-access",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a non-empty array guard before reading the first or last element",
    },
    messages: {
      unsafeArrayAccess: [
        "Check that the array is non-empty before reading its first or last element.",
        "",
        "Why: arr[0], arr[arr.length - 1], and leading destructuring return undefined for empty arrays. LLM-generated code often forgets this edge case, which turns into crashes when the value is used immediately.",
        "",
        "How to fix:",
        "  Before: const first = items[0];",
        "  After:  const first = items.length > 0 ? items[0] : undefined;",
        "  Or guard explicitly: if (items.length === 0) return undefined; const [first] = items;",
        "  Or provide a destructuring default: const [first = fallback] = items;",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      MemberExpression(node: TSESTree.MemberExpression) {
        const arrayName = getUnsafeIndexedArrayName(node);
        if (!arrayName || isGuarded(node, arrayName)) return;

        context.report({
          node,
          messageId: "unsafeArrayAccess",
        });
      },

      VariableDeclarator(node: TSESTree.VariableDeclarator) {
        if (node.id.type !== AST_NODE_TYPES.ArrayPattern || !node.init) return;

        const arrayName = getIdentifierName(node.init);
        if (!arrayName || isGuarded(node, arrayName)) return;

        const [firstElement] = node.id.elements;
        if (!firstElement || !requiredElementNeedsGuard(firstElement)) return;

        context.report({
          node: firstElement,
          messageId: "unsafeArrayAccess",
        });
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Check array length before reading the first or last element, or make the undefined fallback explicit",
};
