import path from "path";
import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds = "noMagicNumber";

type Options = [
  {
    ignore?: number[];
    ignoreArrayIndexes?: boolean;
    ignoreDefaultValues?: boolean;
    ignoreEnums?: boolean;
    skipTestFiles?: boolean;
  },
];

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
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const ignore = new Set(options.ignore ?? DEFAULT_IGNORE);
    const ignoreArrayIndexes = options.ignoreArrayIndexes ?? true;
    const ignoreDefaultValues = options.ignoreDefaultValues ?? true;
    const ignoreEnums = options.ignoreEnums ?? true;
    const skipTestFiles = options.skipTestFiles ?? true;

    if (skipTestFiles) {
      const filename = path.basename(context.filename);
      if (/\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filename)) {
        return {};
      }
    }

    function isConstAssignment(node: TSESTree.Node): boolean {
      // Only consider direct const assignment: const X = <number>
      // or const X = <number> * <number> (expressions involving the number)
      // NOT: const x = items[<number>] or const x = fn(<number>)
      let current: TSESTree.Node | undefined = node.parent;

      while (current) {
        if (current.type === AST_NODE_TYPES.VariableDeclarator) {
          // Check this is the init (right side) and the number is used directly
          // not as an argument or computed property
          const declarator = current;
          if (
            declarator.parent?.type === AST_NODE_TYPES.VariableDeclaration &&
            declarator.parent.kind === "const" &&
            declarator.init === node
          ) {
            return true;
          }
          // If we're in a const but nested deeper (e.g., items[5]), don't allow
          return false;
        }
        // Binary expression: const X = 5000 * 2 — keep traversing
        if (current.type === AST_NODE_TYPES.BinaryExpression) {
          node = current;
          current = current.parent;
          continue;
        }
        // Stop at non-expression boundaries
        if (
          current.type === AST_NODE_TYPES.ExpressionStatement ||
          current.type === AST_NODE_TYPES.ReturnStatement ||
          current.type === AST_NODE_TYPES.IfStatement ||
          current.type === AST_NODE_TYPES.FunctionDeclaration ||
          current.type === AST_NODE_TYPES.ArrowFunctionExpression ||
          current.type === AST_NODE_TYPES.FunctionExpression ||
          current.type === AST_NODE_TYPES.CallExpression ||
          current.type === AST_NODE_TYPES.MemberExpression ||
          current.type === AST_NODE_TYPES.TemplateLiteral
        ) {
          return false;
        }
        node = current;
        current = current.parent;
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
