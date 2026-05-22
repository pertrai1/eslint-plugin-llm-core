import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "badMinMaxFunc";

type MathMethodName = "max" | "min";

interface NumericLiteralArgument {
  value: number;
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

function getMathMethodName(
  node: TSESTree.CallExpression,
): MathMethodName | undefined {
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return undefined;
  }

  if (
    node.callee.object.type !== AST_NODE_TYPES.Identifier ||
    node.callee.object.name !== "Math"
  ) {
    return undefined;
  }

  const methodName = getStaticPropertyName(node.callee);
  return methodName === "min" || methodName === "max" ? methodName : undefined;
}

function getNumericLiteralValue(node: TSESTree.Node): number | undefined {
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === "number") {
    return node.value;
  }

  if (
    node.type === AST_NODE_TYPES.UnaryExpression &&
    node.operator === "-" &&
    node.argument.type === AST_NODE_TYPES.Literal &&
    typeof node.argument.value === "number"
  ) {
    return -node.argument.value;
  }

  return undefined;
}

function getSingleNumericLiteralArgument(
  args: TSESTree.CallExpressionArgument[],
): NumericLiteralArgument | undefined {
  const numericArgs: NumericLiteralArgument[] = [];

  for (const arg of args) {
    if (arg.type === AST_NODE_TYPES.SpreadElement) {
      return undefined;
    }

    const value = getNumericLiteralValue(arg);
    if (value !== undefined) {
      numericArgs.push({ value });
    }
  }

  return numericArgs.length === 1 ? numericArgs[0] : undefined;
}

function getSingleNestedMathCall(
  args: TSESTree.CallExpressionArgument[],
): TSESTree.CallExpression | undefined {
  const nestedCalls = args.filter(
    (arg): arg is TSESTree.CallExpression =>
      arg.type === AST_NODE_TYPES.CallExpression &&
      getMathMethodName(arg) !== undefined,
  );

  return nestedCalls.length === 1 ? nestedCalls[0] : undefined;
}

function isImpossibleClamp(node: TSESTree.CallExpression): boolean {
  const outerMethod = getMathMethodName(node);
  if (!outerMethod) {
    return false;
  }

  const innerCall = getSingleNestedMathCall(node.arguments);
  if (!innerCall) {
    return false;
  }

  const innerMethod = getMathMethodName(innerCall);
  if (
    (outerMethod !== "min" || innerMethod !== "max") &&
    (outerMethod !== "max" || innerMethod !== "min")
  ) {
    return false;
  }

  const outerBound = getSingleNumericLiteralArgument(node.arguments);
  const innerBound = getSingleNumericLiteralArgument(innerCall.arguments);

  if (!outerBound || !innerBound) {
    return false;
  }

  if (outerMethod === "min") {
    return innerBound.value > outerBound.value;
  }

  return outerBound.value > innerBound.value;
}

export default createRule<[], MessageIds>({
  name: "bad-min-max-func",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow inverted nested Math.min/Math.max clamps that always return a constant bound",
    },
    messages: {
      badMinMaxFunc: [
        "This nested Math.min/Math.max clamp has inverted numeric bounds, so it always returns a constant.",
        "",
        "Why: `Math.min(Math.max(value, 100), 0)` first raises the value to at least 100, then caps it at 0. The result is always 0. LLMs often generate this when they swap clamp lower and upper bounds.",
        "",
        "How to fix:",
        "  Put the lower bound in Math.max and the upper bound in Math.min.",
        "  Before: Math.min(Math.max(value, 100), 0)",
        "  After:  Math.min(Math.max(value, 0), 100)",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (!isImpossibleClamp(node)) {
          return;
        }

        context.report({
          node,
          messageId: "badMinMaxFunc",
        });
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "When clamping with Math.min/Math.max, keep the lower bound in Math.max and the upper bound in Math.min",
};
