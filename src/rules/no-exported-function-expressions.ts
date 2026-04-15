import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds =
  | "noExportedFunctionExpression"
  | "noDefaultFunctionExpression"
  | "convertToDeclaration"
  | "convertDefaultToDeclaration";

type FuncNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionExpression
  | TSESTree.FunctionDeclaration;

export default createRule<[], MessageIds>({
  name: "no-exported-function-expressions",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce that exported functions use function declarations instead of function expressions or arrow functions",
    },
    hasSuggestions: true,
    messages: {
      noExportedFunctionExpression: [
        "Exported function '{{ name }}' must use a function declaration, not a function expression or arrow function.",
        "",
        "Why: Function declarations are hoisted, produce better stack traces, and signal clear intent.",
        "Arrow functions are best reserved for callbacks and inline expressions, not top-level exports.",
        "",
        "How to fix:",
        "  Replace: export const {{ name }} = {{ async }}({{ params }}) => { ... }",
        "  With:    export {{ async }}function {{ name }}({{ params }}) { ... }",
      ].join("\n"),
      noDefaultFunctionExpression: [
        "Default export must use a named function declaration, not a function expression or arrow function.",
        "",
        "Why: Named function declarations produce meaningful stack traces and are self-documenting.",
        "Anonymous default exports make debugging harder and reduce code readability.",
        "",
        "How to fix:",
        "  Replace: export default {{ async }}({{ params }}) => { ... }",
        "  With:    export default {{ async }}function myFunction({{ params }}) { ... }",
      ].join("\n"),
      convertToDeclaration:
        "Convert to function declaration: export {{ async }}function {{ name }}({{ params }}) { ... }",
      convertDefaultToDeclaration:
        "Convert to named function declaration: export default {{ async }}function functionName({{ params }}) { ... }",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    function getParamsText(node: FuncNode): string {
      if (node.params.length === 0) return "";
      return node.params.map((p) => sourceCode.getText(p)).join(", ");
    }

    function getFunctionParts(node: FuncNode) {
      const asyncStr = node.async ? "async " : "";
      const params = getParamsText(node);
      const typeParamsText = node.typeParameters
        ? sourceCode.getText(node.typeParameters)
        : "";
      const returnTypeText = node.returnType
        ? sourceCode.getText(node.returnType)
        : "";

      let bodyText: string;
      if (node.body.type === AST_NODE_TYPES.BlockStatement) {
        bodyText = sourceCode.getText(node.body);
      } else {
        bodyText = `{\n  return ${sourceCode.getText(node.body)};\n}`;
      }

      return { asyncStr, params, typeParamsText, returnTypeText, bodyText };
    }

    return {
      ExportNamedDeclaration(node) {
        if (
          !node.declaration ||
          node.declaration.type !== AST_NODE_TYPES.VariableDeclaration
        ) {
          return;
        }

        for (const declarator of node.declaration.declarations) {
          if (
            !declarator.init ||
            (declarator.init.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
              declarator.init.type !== AST_NODE_TYPES.FunctionExpression)
          ) {
            continue;
          }

          const name =
            declarator.id.type === AST_NODE_TYPES.Identifier
              ? declarator.id.name
              : "unknown";

          const funcNode = declarator.init;
          const { asyncStr, params, typeParamsText, returnTypeText, bodyText } =
            getFunctionParts(funcNode);

          context.report({
            node: declarator,
            messageId: "noExportedFunctionExpression",
            data: { name, async: asyncStr, params },
            suggest: [
              {
                messageId: "convertToDeclaration",
                data: { name, async: asyncStr, params },
                fix(fixer) {
                  const declaration = `${asyncStr}function ${name}${typeParamsText}(${params})${returnTypeText} ${bodyText}`;
                  return fixer.replaceText(node, `export ${declaration}`);
                },
              },
            ],
          });
        }
      },

      ExportDefaultDeclaration(node) {
        const declaration = node.declaration;

        // Catch arrow functions, function expressions, and anonymous function declarations
        const isArrowOrExpression =
          declaration.type === AST_NODE_TYPES.ArrowFunctionExpression ||
          declaration.type === AST_NODE_TYPES.FunctionExpression;

        const isAnonymousDeclaration =
          declaration.type === AST_NODE_TYPES.FunctionDeclaration &&
          !declaration.id;

        if (!isArrowOrExpression && !isAnonymousDeclaration) {
          return;
        }

        const funcNode = declaration as FuncNode;
        const { asyncStr, params, typeParamsText, returnTypeText, bodyText } =
          getFunctionParts(funcNode);

        context.report({
          node: declaration,
          messageId: "noDefaultFunctionExpression",
          data: { async: asyncStr, params },
          suggest: [
            {
              messageId: "convertDefaultToDeclaration",
              data: { async: asyncStr, params },
              fix(fixer) {
                const newDeclaration = `${asyncStr}function functionName${typeParamsText}(${params})${returnTypeText} ${bodyText}`;
                return fixer.replaceText(
                  node,
                  `export default ${newDeclaration}`,
                );
              },
            },
          ],
        });
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Use function declarations for all exports — 'export function foo()' not 'export const foo = () =>'",
};
