import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "maxNestingDepth";

type Options = [
  {
    max?: number;
  },
];

export const instruction: RuleInstruction = {
  principle:
    "Keep nesting depth under {max} — use guard clauses and helper functions",
};

export default createRule<Options, MessageIds>({
  name: "max-nesting-depth",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce a maximum nesting depth for control flow statements to reduce cognitive complexity",
    },
    messages: {
      maxNestingDepth: [
        "Nesting depth {{ depth }} exceeds the maximum of {{ max }}.",
        "",
        "Why: Deeply nested code is harder to read, test, and maintain.",
        "Each nesting level multiplies cognitive load for anyone reading the code.",
        "",
        "How to fix:",
        "  1. Use guard clauses: invert the condition and return early",
        "     Before: if (user) { if (user.isActive) { doWork(); } }",
        "     After:  if (!user) return; if (!user.isActive) return; doWork();",
        "  2. Extract nested blocks into named helper functions",
        "     Before: if (a) { for (...) { if (b) { ... } } }",
        "     After:  if (a) { processItems(items); }",
        "  3. Replace nested if/else chains with early returns or switch/map lookups",
      ].join("\n"),
    },
    schema: [
      {
        type: "object",
        properties: {
          max: {
            type: "integer",
            minimum: 1,
            description: "Maximum allowed nesting depth (default: 3)",
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ max: 3 }],
  },
  defaultOptions: [{ max: 3 }],
  create(context, [options]) {
    const max = options.max ?? 3;
    const reported = new Set<TSESTree.Node>();

    // Each function boundary gets its own depth counter so nesting inside
    // a helper function starts fresh at 0.
    const depthStack: number[] = [0];

    function currentDepth(): number {
      return depthStack[depthStack.length - 1]!;
    }

    function setDepth(n: number): void {
      depthStack[depthStack.length - 1] = n;
    }

    function enterFunction() {
      depthStack.push(0);
    }

    function exitFunction() {
      depthStack.pop();
    }

    function enterNesting(node: TSESTree.Node) {
      setDepth(currentDepth() + 1);
      if (currentDepth() > max && !reported.has(node)) {
        reported.add(node);
        context.report({
          node,
          messageId: "maxNestingDepth",
          data: {
            depth: String(currentDepth()),
            max: String(max),
          },
        });
      }
    }

    function exitNesting() {
      setDepth(currentDepth() - 1);
    }

    function enterElseIf(node: TSESTree.IfStatement) {
      // "else if" — the parent if's alternate is this if.
      // Don't count it as additional nesting since it reads flat.
      const parent = node.parent;
      if (
        parent &&
        parent.type === AST_NODE_TYPES.IfStatement &&
        parent.alternate === node
      ) {
        // This is an else-if, don't increment depth
        return;
      }
      enterNesting(node);
    }

    function exitElseIf(node: TSESTree.IfStatement) {
      const parent = node.parent;
      if (
        parent &&
        parent.type === AST_NODE_TYPES.IfStatement &&
        parent.alternate === node
      ) {
        return;
      }
      exitNesting();
    }

    return {
      FunctionDeclaration: enterFunction,
      "FunctionDeclaration:exit": exitFunction,
      FunctionExpression: enterFunction,
      "FunctionExpression:exit": exitFunction,
      ArrowFunctionExpression: enterFunction,
      "ArrowFunctionExpression:exit": exitFunction,
      IfStatement: enterElseIf,
      "IfStatement:exit": exitElseIf,
      ForStatement: enterNesting,
      "ForStatement:exit": exitNesting,
      ForInStatement: enterNesting,
      "ForInStatement:exit": exitNesting,
      ForOfStatement: enterNesting,
      "ForOfStatement:exit": exitNesting,
      WhileStatement: enterNesting,
      "WhileStatement:exit": exitNesting,
      DoWhileStatement: enterNesting,
      "DoWhileStatement:exit": exitNesting,
      SwitchStatement: enterNesting,
      "SwitchStatement:exit": exitNesting,
      TryStatement: enterNesting,
      "TryStatement:exit": exitNesting,
    };
  },
});
