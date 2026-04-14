import type { Rule } from "eslint";
import { AST_NODE_TYPES, TSESLint, TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds = "maxComplexity";

type Options = [
  {
    max?: number;
    skipTestFiles?: boolean;
  },
];

export default createRule<Options, MessageIds>({
  name: "max-complexity",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce a maximum cyclomatic complexity per function to encourage decomposition",
    },
    messages: {
      maxComplexity: [
        "Function '{{ name }}' has a complexity of {{ count }}, exceeding the maximum of {{ max }}.",
        "",
        "Why: Each branching path is an independent surface for logic errors — high-complexity functions are harder to test and modify safely.",
        "",
        "How to fix:",
        "  Replace branching logic with a data structure.",
        "  Before: if (type === 'a') return 1; else if (type === 'b') return 2; else if (type === 'c') return 3;",
        "  After:  const VALUES: Record<string, number> = { a: 1, b: 2, c: 3 };",
        "          function getValue(type: string): number { return VALUES[type] ?? 0; }",
      ].join("\n"),
    },
    schema: [
      {
        type: "object",
        properties: {
          max: {
            type: "integer",
            minimum: 1,
            description: "Maximum allowed cyclomatic complexity (default: 10)",
          },
          skipTestFiles: {
            type: "boolean",
            description:
              "Whether to skip test files (.test.ts, .spec.ts) (default: true)",
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ max: 10, skipTestFiles: true }],
  },
  defaultOptions: [{ max: 10, skipTestFiles: true }],
  create(context, [options]) {
    const max = options.max ?? 10;
    const complexityStack: number[] = [];

    function currentComplexity(): number {
      return complexityStack[complexityStack.length - 1]!;
    }

    function increaseComplexity(): void {
      complexityStack[complexityStack.length - 1] = currentComplexity() + 1;
    }

    function onCodePathStart(): void {
      complexityStack.push(1);
    }

    function onCodePathEnd(codePath: Rule.CodePath, node: TSESTree.Node): void {
      const complexity = complexityStack.pop();

      if (
        !complexity ||
        codePath.origin !== "function" ||
        complexity <= max ||
        (node.type !== AST_NODE_TYPES.FunctionDeclaration &&
          node.type !== AST_NODE_TYPES.FunctionExpression &&
          node.type !== AST_NODE_TYPES.ArrowFunctionExpression)
      ) {
        return;
      }

      context.report({
        node,
        messageId: "maxComplexity",
        data: {
          name: getFunctionName(node),
          count: String(complexity),
          max: String(max),
        },
      });
    }

    function getFunctionName(node: TSESTree.Node): string {
      if (node.type === AST_NODE_TYPES.FunctionDeclaration && node.id) {
        return node.id.name;
      }

      return "anonymous";
    }

    const listeners = {
      onCodePathStart,
      IfStatement() {
        increaseComplexity();
      },
      onCodePathEnd,
    } as unknown as TSESLint.RuleListener;

    return listeners;
  },
});
