import { TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "noSwallowedErrors";

export default createRule<[], MessageIds>({
  name: "no-swallowed-errors",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow catch blocks that only log to console and swallow the error",
    },
    messages: {
      noSwallowedErrors: [
        "Catch block only logs the error — it is silently swallowed.",
        "",
        "Why: Logging an error without rethrowing, returning, or delegating to an error handler",
        "means the program continues as if nothing failed. Callers cannot detect or recover from",
        "the failure.",
        "",
        "How to fix:",
        "  Choose one explicit outcome:",
        "  Before: catch (error) { console.log(error); }",
        "  After:  catch (error) { throw new Error('Failed to process', { cause: error }); }",
        "  After:  catch (error) { logger.error('Process failed', { error }); return { success: false, error }; }",
        "  After:  catch (error) { Sentry.captureException(error); }",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function isConsoleOnlyCatchStatement(
      statement: TSESTree.Statement,
    ): boolean {
      if (statement.type !== "ExpressionStatement") {
        return false;
      }

      const expression = statement.expression;
      if (expression.type !== "CallExpression") {
        return false;
      }

      const callee = expression.callee;
      if (callee.type !== "MemberExpression" || callee.computed) {
        return false;
      }

      if (
        callee.object.type !== "Identifier" ||
        callee.object.name !== "console"
      ) {
        return false;
      }

      return (
        callee.property.type === "Identifier" &&
        ["log", "warn", "error", "debug"].includes(callee.property.name)
      );
    }

    return {
      CatchClause(node: TSESTree.CatchClause) {
        const statements = node.body.body.filter(
          (
            statement,
          ): statement is Exclude<
            TSESTree.Statement,
            TSESTree.EmptyStatement
          > => statement.type !== "EmptyStatement",
        );

        if (statements.length === 0) {
          return;
        }

        if (statements.every(isConsoleOnlyCatchStatement)) {
          context.report({
            node: node.body,
            messageId: "noSwallowedErrors",
          });
        }
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Don't swallow errors in catch blocks that only log to console — rethrow, return, or delegate to an error handler",
};
