import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds = "consistentCatchParamName";

type Options = [
  {
    name?: string;
  },
];

export default createRule<Options, MessageIds>({
  name: "consistent-catch-param-name",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce consistent naming for catch clause parameters across the codebase",
    },
    messages: {
      consistentCatchParamName: [
        "Catch parameter is named '{{ actual }}' but should be '{{ expected }}'.",
        "",
        "Why: LLMs frequently mix naming conventions (e, err, error, ex) in the same",
        "codebase. Consistent naming makes error handling patterns more recognizable,",
        "reduces cognitive load when reviewing code, and makes search/refactoring easier.",
        "",
        "How to fix: Rename the catch parameter from '{{ actual }}' to '{{ expected }}'.",
        "  Before: catch ({{ actual }}) { ... }",
        "  After:  catch ({{ expected }}) { ... }",
      ].join("\n"),
    },
    schema: [
      {
        type: "object",
        properties: {
          name: {
            type: "string",
            minLength: 1,
            description:
              "The required name for catch clause parameters (default: 'error')",
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ name: "error" }],
  },
  defaultOptions: [{ name: "error" }],
  create(context, [options]) {
    const expectedName = options.name ?? "error";

    return {
      CatchClause(node: TSESTree.CatchClause) {
        const param = node.param;

        // Optional catch binding (catch {}) — nothing to check
        if (param === null) {
          return;
        }

        // Destructuring patterns (catch ({ message }) or catch ([a])) — skip
        if (param.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        if (param.name !== expectedName) {
          context.report({
            node: param,
            messageId: "consistentCatchParamName",
            data: {
              actual: param.name,
              expected: expectedName,
            },
          });
        }
      },
    };
  },
});
