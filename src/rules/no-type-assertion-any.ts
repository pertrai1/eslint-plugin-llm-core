import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "noTypeAssertionAny";

export default createRule<[], MessageIds>({
  name: "no-type-assertion-any",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow type assertions to `any` that bypass TypeScript's type safety",
    },
    messages: {
      noTypeAssertionAny: [
        "Do not use '{{ assertion }}' — this bypasses all type checking.",
        "",
        "Why: Asserting a value as `any` disables TypeScript's ability to catch",
        "type errors at the assertion site and everywhere the value flows afterward.",
        "It is the most common escape hatch, but it silently introduces runtime risks.",
        "",
        "How to fix:",
        "  Before: const result = data as any;",
        "  After:  const result = data as unknown as ExpectedType;",
        "",
        "  Before: (response as any).body",
        "  After:  (response as ResponseWithBody).body",
        "",
        "If you genuinely don't know the type, use `unknown` and narrow with",
        "type guards — this forces you to handle the type explicitly.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function isAnyKeyword(node: TSESTree.TypeNode): boolean {
      return node.type === AST_NODE_TYPES.TSAnyKeyword;
    }

    return {
      TSAsExpression(node: TSESTree.TSAsExpression) {
        if (isAnyKeyword(node.typeAnnotation)) {
          const sourceCode = context.sourceCode;
          const expressionText = sourceCode.getText(node.expression);
          const truncated =
            expressionText.length > 30
              ? expressionText.slice(0, 30) + "..."
              : expressionText;

          context.report({
            node,
            messageId: "noTypeAssertionAny",
            data: {
              assertion: `${truncated} as any`,
            },
          });
        }
      },
      TSTypeAssertion(node: TSESTree.TSTypeAssertion) {
        if (isAnyKeyword(node.typeAnnotation)) {
          const sourceCode = context.sourceCode;
          const expressionText = sourceCode.getText(node.expression);
          const truncated =
            expressionText.length > 30
              ? expressionText.slice(0, 30) + "..."
              : expressionText;

          context.report({
            node,
            messageId: "noTypeAssertionAny",
            data: {
              assertion: `<any>${truncated}`,
            },
          });
        }
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle: "Never use type assertions to 'any'",
};
