import path from "path";
import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "noMagicNumber";

type Options = [
  {
    ignore?: number[];
    ignoreArrayIndexes?: boolean;
    ignoreDefaultValues?: boolean;
    ignoreEnums?: boolean;
    skipTestFiles?: boolean;
    ignoreObjectProperties?: boolean;
  },
];

export const instruction: RuleInstruction = {
  principle: "Extract named constants for all magic numbers",
  optionTemplate:
    "Extract named constants for magic numbers (ignore: {ignore})",
};

const DEFAULT_IGNORE = [0, 1, -1, 2];

export default createRule<Options, MessageIds>({
  name: "no-magic-numbers",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow magic numbers and enforce named constants for clarity",
    },
    messages: {
      noMagicNumber: [
        "Magic number {{ value }} should be extracted to a named constant.",
        "",
        "Why: Magic numbers make code harder to understand and maintain.",
        "A reader can't tell what {{ value }} represents without context.",
        "",
        "How to fix:",
        "  Extract to a named constant that describes its purpose:",
        "",
        "  Before: if (retries > {{ value }}) { ... }",
        "  After:  const MAX_RETRIES = {{ value }};",
        "          if (retries > MAX_RETRIES) { ... }",
      ].join("\n"),
    },
    schema: [
      {
        type: "object",
        properties: {
          ignore: {
            type: "array",
            items: { type: "number" },
            description: "Numbers to allow (default: [0, 1, -1, 2])",
          },
          ignoreArrayIndexes: {
            type: "boolean",
            description: "Allow numbers used as array indexes (default: true)",
          },
          ignoreDefaultValues: {
            type: "boolean",
            description:
              "Allow numbers used as default parameter values (default: true)",
          },
          ignoreEnums: {
            type: "boolean",
            description:
              "Allow numbers used in enum initializers (default: true)",
          },
          skipTestFiles: {
            type: "boolean",
            description:
              "Whether to skip test files (.test.ts, .spec.ts) (default: true)",
          },
          ignoreObjectProperties: {
            type: "boolean",
            description:
              "Allow numbers used as object literal property values (default: false)",
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{}],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const ignore = new Set(options.ignore ?? DEFAULT_IGNORE);
    const ignoreArrayIndexes = options.ignoreArrayIndexes ?? true;
    const ignoreDefaultValues = options.ignoreDefaultValues ?? true;
    const ignoreEnums = options.ignoreEnums ?? true;
    const skipTestFiles = options.skipTestFiles ?? true;
    const ignoreObjectProperties = options.ignoreObjectProperties ?? false;

    if (skipTestFiles) {
      const filename = path.basename(context.filename);
      if (/\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filename)) {
        return {};
      }
    }

    function isConstAssignment(node: TSESTree.Node): boolean {
      // Walk up from the literal to find the outermost expression that
      // contains it, then check if that expression is the init of a const
      // declaration. Only binary and unary expressions are traversed —
      // calls, member access, template literals, etc. stop the search.
      let expression: TSESTree.Node = node;
      let current: TSESTree.Node | undefined = node.parent;

      while (current) {
        if (current.type === AST_NODE_TYPES.VariableDeclarator) {
          if (
            current.parent?.type === AST_NODE_TYPES.VariableDeclaration &&
            current.parent.kind === "const" &&
            current.init === expression
          ) {
            return true;
          }
          return false;
        }
        if (
          current.type === AST_NODE_TYPES.BinaryExpression ||
          current.type === AST_NODE_TYPES.UnaryExpression ||
          current.type === AST_NODE_TYPES.TSAsExpression ||
          current.type === AST_NODE_TYPES.TSSatisfiesExpression ||
          current.type === AST_NODE_TYPES.TSNonNullExpression ||
          current.type === AST_NODE_TYPES.TSTypeAssertion
        ) {
          expression = current;
          current = current.parent;
          continue;
        }
        // Any other node type means the number is not a simple const init
        return false;
      }
      return false;
    }

    function isArrayIndex(node: TSESTree.Literal): boolean {
      if (!ignoreArrayIndexes) return false;
      return (
        node.parent?.type === AST_NODE_TYPES.MemberExpression &&
        node.parent.computed &&
        node.parent.property === node
      );
    }

    function isDefaultValue(node: TSESTree.Literal): boolean {
      if (!ignoreDefaultValues) return false;
      return node.parent?.type === AST_NODE_TYPES.AssignmentPattern;
    }

    function isEnumMember(node: TSESTree.Literal): boolean {
      if (!ignoreEnums) return false;
      return node.parent?.type === AST_NODE_TYPES.TSEnumMember;
    }

    function isObjectPropertyValue(node: TSESTree.Literal): boolean {
      if (!ignoreObjectProperties) return false;

      let current: TSESTree.Node = node;
      let parent: TSESTree.Node | undefined = node.parent;

      while (parent) {
        if (parent.type === AST_NODE_TYPES.Property) {
          return (
            parent.parent?.type === AST_NODE_TYPES.ObjectExpression &&
            parent.kind === "init" &&
            parent.value === current
          );
        }

        if (
          parent.type === AST_NODE_TYPES.ObjectExpression ||
          parent.type === AST_NODE_TYPES.ArrayExpression ||
          parent.type === AST_NODE_TYPES.CallExpression ||
          parent.type === AST_NODE_TYPES.NewExpression ||
          parent.type === AST_NODE_TYPES.AssignmentExpression ||
          parent.type === AST_NODE_TYPES.VariableDeclarator ||
          parent.type === AST_NODE_TYPES.ReturnStatement ||
          parent.type === AST_NODE_TYPES.ArrowFunctionExpression ||
          parent.type === AST_NODE_TYPES.FunctionExpression ||
          parent.type === AST_NODE_TYPES.FunctionDeclaration ||
          parent.type === AST_NODE_TYPES.Program
        ) {
          return false;
        }

        current = parent;
        parent = parent.parent;
      }

      return false;
    }

    function isTypeContext(node: TSESTree.Node): boolean {
      let current: TSESTree.Node | undefined = node.parent;
      while (current) {
        if (
          current.type === AST_NODE_TYPES.TSTypeAliasDeclaration ||
          current.type === AST_NODE_TYPES.TSInterfaceDeclaration ||
          current.type === AST_NODE_TYPES.TSTypeAnnotation
        ) {
          return true;
        }
        current = current.parent;
      }
      return false;
    }

    return {
      Literal(node) {
        if (typeof node.value !== "number") return;

        const value = node.value;

        if (ignore.has(value)) return;
        if (isConstAssignment(node)) return;
        if (isArrayIndex(node)) return;
        if (isDefaultValue(node)) return;
        if (isEnumMember(node)) return;
        if (isObjectPropertyValue(node)) return;
        if (isTypeContext(node)) return;

        // Ignore negative numbers by checking parent UnaryExpression
        if (
          node.parent?.type === AST_NODE_TYPES.UnaryExpression &&
          node.parent.operator === "-" &&
          ignore.has(-value)
        ) {
          return;
        }

        context.report({
          node,
          messageId: "noMagicNumber",
          data: { value: String(value) },
        });
      },
    };
  },
});
