import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "noInlineDisable";

export default createRule<[], MessageIds>({
  name: "no-inline-disable",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow eslint-disable comments that suppress lint errors instead of fixing them",
    },
    messages: {
      noInlineDisable: [
        "Do not use '{{ comment }}' to suppress lint errors — fix the underlying issue instead.",
        "",
        "Why: Disabling lint rules hides problems rather than solving them.",
        "Each suppressed rule exists to catch real issues. Silencing it means the issue remains.",
        "",
        "How to fix:",
        "  Remove the comment and change the code so the rule passes.",
        "  If the rule is genuinely wrong for this code, say so and let the project owner decide; do not suppress it or change the lint config yourself.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const comments = sourceCode.getAllComments();

    for (const comment of comments) {
      const value = comment.value.trim();

      if (
        value.startsWith("eslint-disable") ||
        value.startsWith("eslint-enable")
      ) {
        context.report({
          node: comment as never,
          loc: comment.loc,
          messageId: "noInlineDisable",
          data: {
            comment: `// ${value.split("\n")[0]!.trim()}`,
          },
        });
      }
    }

    return {};
  },
});

export const instruction: RuleInstruction = {
  principle: "No eslint-disable comments — fix the underlying issue instead",
};
