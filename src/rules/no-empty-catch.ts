import { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds = "noEmptyCatch";

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
        "Empty catch block silently swallows errors — add meaningful handling.",
        "",
        "Why: An empty (or comment-only) catch block hides failures completely.",
        "The error is never logged, reported, or surfaced, so bugs become invisible",
        "and systems silently degrade. Even when you intentionally want to ignore an",
        "error, future readers have no signal that this was deliberate.",
        "",
        "How to fix (choose the right level of handling):",
        "  Log and continue:  catch (e) { logger.error('context', e); }",
        "  Rethrow with context: catch (e) {",
        "                          throw new Error('failed to X', { cause: e });",
        "                        }",
        "  Return a safe default: catch { return null; }",
        "  If truly intentional, document it explicitly:",
        "    catch (e) {",
        "      // Best-effort cleanup — failure here is non-fatal",
        "      // because <reason>. Parent will handle the primary error.",
        "    }",
        "  Note: a comment alone is not considered meaningful handling.",
        "  Add at minimum a log statement or a return/throw.",
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
