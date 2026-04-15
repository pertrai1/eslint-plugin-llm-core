import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "throwErrorObjects";

export const instruction: RuleInstruction = {
  principle: "Always throw Error objects, never strings or plain objects",
};

export default createRule<[], MessageIds>({
  name: "throw-error-objects",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow throwing non-Error values such as strings, template literals, plain objects, or arrays",
    },
    messages: {
      throwErrorObjects: [
        "Do not throw {{ kind }} — throw an Error instance instead.",
        "",
        "Why: Throwing a non-Error value loses the stack trace, making it impossible",
        "to find where the error originated. catch (e) handlers that check e.message",
        "or e.stack will receive undefined. Many error-reporting tools and loggers",
        "also expect an Error object and silently drop other types.",
        "",
        "How to fix:",
        "  Before: throw 'something went wrong';",
        "  Before: throw { code: 404, message: 'not found' };",
        "  After:  throw new Error('something went wrong');",
        "  After:  throw Object.assign(new Error('not found'), { code: 404 });",
        "",
        "  Or use a typed subclass:",
        "    class NotFoundError extends Error {",
        "      constructor(public code: number) { super('not found'); }",
        "    }",
        "    throw new NotFoundError(404);",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function describeKind(node: TSESTree.Expression): string | null {
      switch (node.type) {
        case AST_NODE_TYPES.Literal:
          if (typeof node.value === "string") return "a string literal";
          if (typeof node.value === "number") return "a number literal";
          if (typeof node.value === "boolean") return "a boolean literal";
          return "a literal value";
        case AST_NODE_TYPES.TemplateLiteral:
          return "a template literal";
        case AST_NODE_TYPES.ObjectExpression:
          return "a plain object";
        case AST_NODE_TYPES.ArrayExpression:
          return "an array";
        default:
          return null;
      }
    }

    return {
      ThrowStatement(node: TSESTree.ThrowStatement) {
        const kind = describeKind(node.argument);
        if (kind !== null) {
          context.report({
            node: node.argument,
            messageId: "throwErrorObjects",
            data: { kind },
          });
        }
      },
    };
  },
});
