import type { Rule } from "eslint";
import path from "path";
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
    const skipTestFiles = options.skipTestFiles ?? true;
    const complexityStack: number[] = [];

    if (skipTestFiles) {
      const filename = path.basename(context.filename);
      if (/\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filename)) {
        return {};
      }
    }

    function currentComplexity(): number {
      return complexityStack[complexityStack.length - 1] ?? 1;
    }

    function increaseComplexity(): void {
      complexityStack[complexityStack.length - 1] = currentComplexity() + 1;
    }

    function onCodePathStart(): void {
      complexityStack.push(1);
    }

    function onCodePathEnd(codePath: Rule.CodePath, node: TSESTree.Node): void {
      const complexity = complexityStack.pop();
      const name = getCodePathName(codePath, node);

      if (!complexity || !name || complexity <= max) {
        return;
      }

      context.report({
        node,
        messageId: "maxComplexity",
        data: {
          name,
          count: String(complexity),
          max: String(max),
        },
      });
    }

    function getCodePathName(
      codePath: Rule.CodePath,
      node: TSESTree.Node,
    ): string | null {
      if (codePath.origin === "class-field-initializer") {
        return "class field initializer";
      }

      if (codePath.origin === "class-static-block") {
        return "class static block";
      }

      if (
        codePath.origin === "function" &&
        (node.type === AST_NODE_TYPES.FunctionDeclaration ||
          node.type === AST_NODE_TYPES.FunctionExpression ||
          node.type === AST_NODE_TYPES.ArrowFunctionExpression)
      ) {
        return getFunctionName(node);
      }

      return null;
    }

    function getFunctionName(node: TSESTree.Node): string {
      if (node.type === AST_NODE_TYPES.FunctionDeclaration && node.id) {
        return node.id.name;
      }

      if (
        (node.type === AST_NODE_TYPES.FunctionExpression ||
          node.type === AST_NODE_TYPES.ArrowFunctionExpression) &&
        node.parent?.type === AST_NODE_TYPES.VariableDeclarator &&
        node.parent.id.type === AST_NODE_TYPES.Identifier
      ) {
        return node.parent.id.name;
      }

      if (
        (node.type === AST_NODE_TYPES.FunctionExpression ||
          node.type === AST_NODE_TYPES.ArrowFunctionExpression) &&
        node.parent?.type === AST_NODE_TYPES.Property &&
        node.parent.key.type === AST_NODE_TYPES.Identifier
      ) {
        return node.parent.key.name;
      }

      if (
        (node.type === AST_NODE_TYPES.FunctionExpression ||
          node.type === AST_NODE_TYPES.ArrowFunctionExpression) &&
        node.parent?.type === AST_NODE_TYPES.MethodDefinition
      ) {
        if (node.parent.key.type === AST_NODE_TYPES.Identifier) {
          return node.parent.key.name;
        }
        if (node.parent.key.type === AST_NODE_TYPES.PrivateIdentifier) {
          return `#${node.parent.key.name}`;
        }
      }

      return "anonymous";
    }

    const listeners = {
      onCodePathStart,
      CatchClause: increaseComplexity,
      ConditionalExpression: increaseComplexity,
      LogicalExpression: increaseComplexity,
      ForStatement: increaseComplexity,
      ForInStatement: increaseComplexity,
      ForOfStatement: increaseComplexity,
      IfStatement() {
        increaseComplexity();
      },
      WhileStatement: increaseComplexity,
      DoWhileStatement: increaseComplexity,
      AssignmentPattern: increaseComplexity,
      "SwitchCase[test]": increaseComplexity,
      AssignmentExpression(node: TSESTree.AssignmentExpression) {
        if (
          node.operator === "&&=" ||
          node.operator === "||=" ||
          node.operator === "??="
        ) {
          increaseComplexity();
        }
      },
      MemberExpression(node: TSESTree.MemberExpression) {
        if (node.optional === true) {
          increaseComplexity();
        }
      },
      CallExpression(node: TSESTree.CallExpression) {
        if (node.optional === true) {
          increaseComplexity();
        }
      },
      onCodePathEnd,
    } as unknown as TSESLint.RuleListener;

    return listeners;
  },
});
