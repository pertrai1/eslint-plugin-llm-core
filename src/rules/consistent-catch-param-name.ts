import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "consistentCatchParamName" | "renameCatchParam";

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
    hasSuggestions: true,
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
      renameCatchParam: "Rename '{{ actual }}' to '{{ expected }}'",
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
          const actualName = param.name;
          context.report({
            node: param,
            messageId: "consistentCatchParamName",
            data: {
              actual: actualName,
              expected: expectedName,
            },
            suggest: [
              {
                messageId: "renameCatchParam",
                data: { actual: actualName, expected: expectedName },
                fix(fixer) {
                  const scope = context.sourceCode.getScope(node);
                  const variable = scope.variables.find(
                    (v) => v.name === actualName,
                  );
                  // Replace only the name portion of the param to preserve any
                  // TypeScript type annotation (e.g. catch (e: unknown))
                  const paramNameFix = fixer.replaceTextRange(
                    [param.range[0], param.range[0] + actualName.length],
                    expectedName,
                  );
                  if (!variable) {
                    return paramNameFix;
                  }
                  return [
                    paramNameFix,
                    ...variable.references.map((ref) =>
                      fixer.replaceText(ref.identifier, expectedName),
                    ),
                  ];
                },
              },
            ],
          });
        }
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle: "Name all catch parameters '{name}' consistently",
};
