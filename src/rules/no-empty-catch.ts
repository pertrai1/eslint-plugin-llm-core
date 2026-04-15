import { TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "noEmptyCatch";

export const instruction: RuleInstruction = {
  principle:
    "Never leave catch blocks empty — handle, rethrow, or log the error",
};

export default createRule<[], MessageIds>({
  name: "no-empty-catch",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow catch blocks with no meaningful error handling (empty or comment-only blocks)",
    },
    messages: {
      noEmptyCatch: [
        "Empty catch block silently swallows errors — choose an explicit outcome.",
        "",
        "Why: Readers and callers cannot tell whether the failure was handled intentionally or dropped by accident.",
        "",
        "How to fix:",
        "  Choose one explicit outcome:",
        "  Before: catch (error) {",
        "          }",
        "  After:  catch (error) { logger.error('context', error); }",
        "  After:  catch (error) { throw new Error('failed to X', { cause: error }); }",
        "  After:  catch { return null; }",
        "  A comment alone does not satisfy this rule.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function isEffectivelyEmptyCatch(body: TSESTree.BlockStatement): boolean {
      return body.body.every(
        (statement) => statement.type === "EmptyStatement",
      );
    }

    return {
      CatchClause(node: TSESTree.CatchClause) {
        const body = node.body;
        if (isEffectivelyEmptyCatch(body)) {
          context.report({
            node: body,
            messageId: "noEmptyCatch",
          });
        }
      },
    };
  },
});
