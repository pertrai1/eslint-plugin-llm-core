import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds =
  | "redundantBooleanComparison"
  | "redundantBooleanComparisonSuggest"
  | "unnecessaryElse"
  | "unnecessaryElseSuggest"
  | "ternaryBooleanLiteral"
  | "ternaryBooleanLiteralSuggest"
  | "ifElseBooleanLiteral"
  | "ifElseBooleanLiteralSuggest";

export const instruction: RuleInstruction = {
  principle: "Eliminate redundant boolean logic and unnecessary control flow",
};

function isBooleanLiteral(
  node: TSESTree.Node,
): node is TSESTree.Literal & { value: boolean } {
  return (
    node.type === AST_NODE_TYPES.Literal && typeof node.value === "boolean"
  );
}

function needsNegationParens(node: TSESTree.Node): boolean {
  return (
    node.type !== AST_NODE_TYPES.Identifier &&
    node.type !== AST_NODE_TYPES.MemberExpression &&
    node.type !== AST_NODE_TYPES.CallExpression &&
    node.type !== AST_NODE_TYPES.UnaryExpression
  );
}

function negateExpression(text: string, node: TSESTree.Node): string {
  return needsNegationParens(node) ? `!(${text})` : `!${text}`;
}

function isReturnOrThrow(node: TSESTree.Statement): boolean {
  return (
    node.type === AST_NODE_TYPES.ReturnStatement ||
    node.type === AST_NODE_TYPES.ThrowStatement
  );
}

function consequentEndsWithReturnOrThrow(
  consequent: TSESTree.Statement,
): boolean {
  if (isReturnOrThrow(consequent)) return true;
  if (consequent.type === AST_NODE_TYPES.BlockStatement) {
    const last = consequent.body[consequent.body.length - 1];
    return last !== undefined && isReturnOrThrow(last);
  }
  return false;
}

function alternateIsSimple(alternate: TSESTree.Statement): boolean {
  // Direct return or throw (no block): else return x;
  if (isReturnOrThrow(alternate)) return true;
  // Block with exactly one return or throw: else { return x; }
  if (
    alternate.type === AST_NODE_TYPES.BlockStatement &&
    alternate.body.length === 1 &&
    isReturnOrThrow(alternate.body[0])
  ) {
    return true;
  }
  return false;
}

export default createRule<[], MessageIds>({
  name: "no-redundant-logic",
  meta: {
    type: "suggestion",
    hasSuggestions: true,
    docs: {
      description:
        "Disallow redundant boolean logic and unnecessary control flow patterns",
    },
    messages: {
      redundantBooleanComparison: [
        "Redundant comparison to boolean literal — compare directly to the value.",
        "",
        "Why: Comparing a boolean expression to `true` or `false` is redundant.",
        "The expression already evaluates to a boolean, so the comparison adds noise",
        "without changing the semantics.",
        "",
        "How to fix:",
        "  Before: if (isActive === true) { }",
        "  After:  if (isActive) { }",
        "",
        "  Before: if (isValid !== true) { }",
        "  After:  if (!isValid) { }",
        "",
        "  Before: if (hasPermission === false) { }",
        "  After:  if (!hasPermission) { }",
      ].join("\n"),
      redundantBooleanComparisonSuggest: "Remove redundant boolean comparison",
      unnecessaryElse: [
        "Unnecessary `else` — the preceding `if` block always exits.",
        "",
        "Why: When an `if` block ends with `return` or `throw`, the `else` branch",
        "is unreachable via fall-through. Keeping the `else` adds nesting without",
        "benefit and obscures the control flow.",
        "",
        "How to fix:",
        "  Before: if (status === 'active') {",
        "            return 'Active';",
        "          } else {",
        "            return 'Inactive';",
        "          }",
        "  After:  if (status === 'active') {",
        "            return 'Active';",
        "          }",
        "          return 'Inactive';",
      ].join("\n"),
      unnecessaryElseSuggest: "Remove unnecessary else block",
      ternaryBooleanLiteral: [
        "Ternary expression returning boolean literals — simplify to the condition itself.",
        "",
        "Why: `condition ? true : false` is identical to `condition` (or `!condition`).",
        "The ternary adds visual noise without changing the value.",
        "",
        "How to fix:",
        "  Before: const isEligible = age >= 18 ? true : false;",
        "  After:  const isEligible = age >= 18;",
        "",
        "  Before: const isBlocked = isAdmin ? false : true;",
        "  After:  const isBlocked = !isAdmin;",
      ].join("\n"),
      ternaryBooleanLiteralSuggest:
        "Replace ternary with direct boolean expression",
      ifElseBooleanLiteral: [
        "If/else block exclusively returns or assigns boolean literals — simplify.",
        "",
        "Why: When both branches of an if/else only return or assign `true`/`false`,",
        "the entire construct can be replaced with the condition expression directly.",
        "",
        "How to fix:",
        "  Before: if (items.length > 0) {",
        "            return true;",
        "          } else {",
        "            return false;",
        "          }",
        "  After:  return items.length > 0;",
        "",
        "  Before: if (age >= 18) {",
        "            isValid = true;",
        "          } else {",
        "            isValid = false;",
        "          }",
        "  After:  isValid = age >= 18;",
      ].join("\n"),
      ifElseBooleanLiteralSuggest:
        "Replace if/else with direct boolean expression",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    // Pattern 1: redundant boolean comparison (x === true, x !== false, etc.)
    function checkBooleanComparison(node: TSESTree.BinaryExpression): void {
      if (node.operator !== "===" && node.operator !== "!==") return;

      const leftIsBool = isBooleanLiteral(node.left);
      const rightIsBool = isBooleanLiteral(node.right);

      if (!leftIsBool && !rightIsBool) return;

      const boolSide = leftIsBool
        ? (node.left as TSESTree.Literal & { value: boolean })
        : (node.right as TSESTree.Literal & { value: boolean });
      const otherSide = leftIsBool ? node.right : node.left;

      const boolVal = boolSide.value;
      const op = node.operator;
      // Negate when: === false  OR  !== true
      const negative = (op === "===" && !boolVal) || (op === "!==" && boolVal);

      context.report({
        node,
        messageId: "redundantBooleanComparison",
        suggest: [
          {
            messageId: "redundantBooleanComparisonSuggest",
            fix(fixer) {
              const text = sourceCode.getText(otherSide);
              if (negative) {
                return fixer.replaceText(
                  node,
                  negateExpression(text, otherSide),
                );
              }
              return fixer.replaceText(node, text);
            },
          },
        ],
      });
    }

    // Pattern 2: unnecessary else after return/throw
    function checkUnnecessaryElse(node: TSESTree.IfStatement): void {
      if (!node.alternate) return;
      // Exclude else-if chains
      if (node.alternate.type === AST_NODE_TYPES.IfStatement) return;
      if (!consequentEndsWithReturnOrThrow(node.consequent)) return;
      if (!alternateIsSimple(node.alternate)) return;
      // Don't fire if Pattern 4 will give a more specific message
      if (isIfElseBooleanLiteralCase(node)) return;

      const alternate = node.alternate;

      context.report({
        node: alternate,
        messageId: "unnecessaryElse",
        suggest: [
          {
            messageId: "unnecessaryElseSuggest",
            fix(fixer) {
              const line = sourceCode.lines[node.loc.start.line - 1];
              const leadingWhitespace = line.match(/^\s*/)?.[0] ?? "";
              const ifIndent =
                leadingWhitespace.length >= node.loc.start.column
                  ? leadingWhitespace
                  : " ".repeat(node.loc.start.column);
              const consequentEnd = node.consequent.range[1];
              const alternateEnd = alternate.range[1];

              let innerText: string;
              if (alternate.type === AST_NODE_TYPES.BlockStatement) {
                innerText = sourceCode.getText(alternate.body[0]);
              } else {
                innerText = sourceCode.getText(alternate);
              }

              return fixer.replaceTextRange(
                [consequentEnd, alternateEnd],
                `\n${ifIndent}${innerText}`,
              );
            },
          },
        ],
      });
    }

    // Pattern 3: ternary returning boolean literals (cond ? true : false)
    function checkTernaryBooleanLiteral(
      node: TSESTree.ConditionalExpression,
    ): void {
      if (!isBooleanLiteral(node.consequent)) return;
      if (!isBooleanLiteral(node.alternate)) return;

      const consequentVal = (
        node.consequent as TSESTree.Literal & { value: boolean }
      ).value;
      const alternateVal = (
        node.alternate as TSESTree.Literal & { value: boolean }
      ).value;
      // Only flag when the two sides are different booleans
      if (consequentVal === alternateVal) return;

      // consequentVal true: cond ? true : false → cond
      // consequentVal false: cond ? false : true → !cond
      const negate = !consequentVal;

      context.report({
        node,
        messageId: "ternaryBooleanLiteral",
        suggest: [
          {
            messageId: "ternaryBooleanLiteralSuggest",
            fix(fixer) {
              const condText = sourceCode.getText(node.test);
              if (negate) {
                return fixer.replaceText(
                  node,
                  negateExpression(condText, node.test),
                );
              }
              return fixer.replaceText(node, condText);
            },
          },
        ],
      });
    }

    // Helpers for Pattern 4
    function getSingleStmt(
      branch: TSESTree.Statement,
    ): TSESTree.Statement | null {
      if (
        branch.type === AST_NODE_TYPES.BlockStatement &&
        branch.body.length === 1
      ) {
        return branch.body[0];
      }
      if (branch.type !== AST_NODE_TYPES.BlockStatement) return branch;
      return null;
    }

    function getBoolReturn(branch: TSESTree.Statement): boolean | null {
      const stmt = getSingleStmt(branch);
      if (
        !stmt ||
        stmt.type !== AST_NODE_TYPES.ReturnStatement ||
        !stmt.argument ||
        !isBooleanLiteral(stmt.argument)
      ) {
        return null;
      }
      return (stmt.argument as TSESTree.Literal & { value: boolean }).value;
    }

    function getBoolAssignment(
      branch: TSESTree.Statement,
    ): { target: string; value: boolean } | null {
      const stmt = getSingleStmt(branch);
      if (!stmt || stmt.type !== AST_NODE_TYPES.ExpressionStatement)
        return null;
      const expr = stmt.expression;
      if (
        expr.type !== AST_NODE_TYPES.AssignmentExpression ||
        expr.operator !== "=" ||
        !isBooleanLiteral(expr.right)
      ) {
        return null;
      }
      return {
        target: sourceCode.getText(expr.left),
        value: (expr.right as TSESTree.Literal & { value: boolean }).value,
      };
    }

    function isIfElseBooleanLiteralCase(node: TSESTree.IfStatement): boolean {
      if (!node.alternate || node.alternate.type === AST_NODE_TYPES.IfStatement)
        return false;
      const ifReturn = getBoolReturn(node.consequent);
      const elseReturn = getBoolReturn(node.alternate);
      if (ifReturn !== null && elseReturn !== null && ifReturn !== elseReturn)
        return true;
      const ifAssign = getBoolAssignment(node.consequent);
      const elseAssign = getBoolAssignment(node.alternate);
      return (
        ifAssign !== null &&
        elseAssign !== null &&
        ifAssign.target === elseAssign.target &&
        ifAssign.value !== elseAssign.value
      );
    }

    function buildCondExpr(
      condText: string,
      testNode: TSESTree.Expression,
      negate: boolean,
    ): string {
      if (!negate) return condText;
      return negateExpression(condText, testNode);
    }

    // Pattern 4: if/else returning or assigning boolean literals
    function checkIfElseBooleanLiteral(node: TSESTree.IfStatement): void {
      if (!node.alternate) return;
      if (node.alternate.type === AST_NODE_TYPES.IfStatement) return;

      const condText = sourceCode.getText(node.test);

      // Case A: both branches return different boolean literals
      const ifReturn = getBoolReturn(node.consequent);
      const elseReturn = getBoolReturn(node.alternate);
      if (ifReturn !== null && elseReturn !== null && ifReturn !== elseReturn) {
        const condExpr = buildCondExpr(condText, node.test, !ifReturn);
        context.report({
          node,
          messageId: "ifElseBooleanLiteral",
          suggest: [
            {
              messageId: "ifElseBooleanLiteralSuggest",
              fix: (fixer) => fixer.replaceText(node, `return ${condExpr};`),
            },
          ],
        });
        return;
      }

      // Case B: both branches assign boolean literals to the same target
      const ifAssign = getBoolAssignment(node.consequent);
      const elseAssign = getBoolAssignment(node.alternate);
      if (
        ifAssign !== null &&
        elseAssign !== null &&
        ifAssign.target === elseAssign.target &&
        ifAssign.value !== elseAssign.value
      ) {
        const condExpr = buildCondExpr(condText, node.test, !ifAssign.value);
        context.report({
          node,
          messageId: "ifElseBooleanLiteral",
          suggest: [
            {
              messageId: "ifElseBooleanLiteralSuggest",
              fix: (fixer) =>
                fixer.replaceText(node, `${ifAssign.target} = ${condExpr};`),
            },
          ],
        });
      }
    }

    return {
      BinaryExpression: checkBooleanComparison,
      IfStatement(node) {
        checkUnnecessaryElse(node);
        checkIfElseBooleanLiteral(node);
      },
      ConditionalExpression: checkTernaryBooleanLiteral,
    };
  },
});
