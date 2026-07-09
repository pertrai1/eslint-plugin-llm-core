import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "missingParamType" | "missingReturnType";

export default createRule<[], MessageIds>({
  name: "explicit-export-types",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require explicit parameter and return type annotations on exported functions",
    },
    messages: {
      missingParamType: [
        "Parameter '{{ param }}' in exported function '{{ fn }}' is missing a type annotation.",
        "",
        "Why: Exported function parameters should be declared in the contract, not inferred from usage.",
        "",
        "How to fix:",
        "  Before: export function processOrder(order) { ... }",
        "  After:  export function processOrder(order: Order) { ... }",
      ].join("\n"),
      missingReturnType: [
        "Exported function '{{ fn }}' is missing an explicit return type annotation.",
        "",
        "Why: Exported function return types should be declared in the contract, not inferred from the implementation.",
        "",
        "How to fix:",
        "  Before: export function processOrder(order: Order) { ... }",
        "  After:  export function processOrder(order: Order): ProcessedOrder { ... }",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function isPrimitiveLiteralDefault(node: TSESTree.Expression): boolean {
      if (node.type === AST_NODE_TYPES.Literal) {
        return true;
      }
      if (
        node.type === AST_NODE_TYPES.UnaryExpression &&
        (node.operator === "-" || node.operator === "+") &&
        node.argument.type === AST_NODE_TYPES.Literal &&
        typeof node.argument.value === "number"
      ) {
        return true;
      }
      return false;
    }

    function getFunctionName(
      fn:
        | TSESTree.FunctionDeclaration
        | TSESTree.ArrowFunctionExpression
        | TSESTree.FunctionExpression,
      fallback = "(anonymous)",
    ): string {
      if (fn.type === AST_NODE_TYPES.FunctionDeclaration && fn.id) {
        return fn.id.name;
      }
      return fallback;
    }

    function checkParam(param: TSESTree.Parameter, fnName: string): void {
      switch (param.type) {
        case AST_NODE_TYPES.Identifier:
          if (!param.typeAnnotation) {
            context.report({
              node: param,
              messageId: "missingParamType",
              data: { param: param.name, fn: fnName },
            });
          }
          break;
        case AST_NODE_TYPES.AssignmentPattern:
          if (param.left.type === AST_NODE_TYPES.Identifier) {
            if (
              !param.left.typeAnnotation &&
              !isPrimitiveLiteralDefault(param.right)
            ) {
              context.report({
                node: param.left,
                messageId: "missingParamType",
                data: { param: param.left.name, fn: fnName },
              });
            }
          } else if (
            param.left.type === AST_NODE_TYPES.ObjectPattern ||
            param.left.type === AST_NODE_TYPES.ArrayPattern
          ) {
            if (!param.left.typeAnnotation) {
              context.report({
                node: param.left,
                messageId: "missingParamType",
                data: {
                  param: context.sourceCode.getText(param.left),
                  fn: fnName,
                },
              });
            }
          }
          break;
        case AST_NODE_TYPES.RestElement:
          if (!param.typeAnnotation) {
            const argName =
              param.argument.type === AST_NODE_TYPES.Identifier
                ? `...${param.argument.name}`
                : "...rest";
            context.report({
              node: param,
              messageId: "missingParamType",
              data: { param: argName, fn: fnName },
            });
          }
          break;
        case AST_NODE_TYPES.ObjectPattern:
        case AST_NODE_TYPES.ArrayPattern:
          // Destructuring: `{ id }: User` has typeAnnotation on the pattern node
          if (!param.typeAnnotation) {
            context.report({
              node: param,
              messageId: "missingParamType",
              data: { param: context.sourceCode.getText(param), fn: fnName },
            });
          }
          break;
        default:
          break;
      }
    }

    function checkFunction(
      fn:
        | TSESTree.FunctionDeclaration
        | TSESTree.ArrowFunctionExpression
        | TSESTree.FunctionExpression,
      fnName: string,
    ): void {
      if (!fn.returnType) {
        const reportNode =
          fn.type === AST_NODE_TYPES.FunctionDeclaration && fn.id ? fn.id : fn;
        context.report({
          node: reportNode,
          messageId: "missingReturnType",
          data: { fn: fnName },
        });
      }

      for (const param of fn.params) {
        checkParam(param, fnName);
      }
    }

    return {
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration) {
        if (!node.declaration) return;

        if (node.declaration.type === AST_NODE_TYPES.FunctionDeclaration) {
          checkFunction(node.declaration, getFunctionName(node.declaration));
          return;
        }

        if (node.declaration.type === AST_NODE_TYPES.VariableDeclaration) {
          for (const declarator of node.declaration.declarations) {
            if (!declarator.init) continue;
            if (
              declarator.init.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
              declarator.init.type !== AST_NODE_TYPES.FunctionExpression
            ) {
              continue;
            }
            const varName =
              declarator.id.type === AST_NODE_TYPES.Identifier
                ? declarator.id.name
                : "(anonymous)";
            checkFunction(declarator.init, varName);
          }
        }
      },

      ExportDefaultDeclaration(node: TSESTree.ExportDefaultDeclaration) {
        if (
          node.declaration.type !== AST_NODE_TYPES.FunctionDeclaration &&
          node.declaration.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
          node.declaration.type !== AST_NODE_TYPES.FunctionExpression
        ) {
          return;
        }
        const fn = node.declaration;
        checkFunction(fn, getFunctionName(fn, "default"));
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Add explicit parameter and return type annotations on all exported functions",
};
