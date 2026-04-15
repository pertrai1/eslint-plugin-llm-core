import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "preferUnknownInCatch";

export const instruction: RuleInstruction = {
  principle: "Use 'unknown' for catch parameter types, not 'any'",
};

export default createRule<[], MessageIds>({
  name: "prefer-unknown-in-catch",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `any` type annotation on catch clause parameters; prefer `unknown`",
    },
    messages: {
      preferUnknownInCatch: [
        "Catch parameter typed as `any` — use `unknown` instead and narrow before use.",
        "",
        "Why: Typing a catch parameter as `any` disables all type-checking for that",
        "variable. You can accidentally call .message on a non-Error, access undefined",
        "properties, or pass the value to typed functions without any safety.",
        "TypeScript defaults catch parameters to `unknown` since TS 4.0 for exactly",
        "this reason (useUnknownInCatchVariables).",
        "",
        "How to fix:",
        "  Before: catch (e: any) { console.log(e.message); }",
        "",
        "  After:  catch (e: unknown) {",
        "            if (e instanceof Error) {",
        "              console.log(e.message);   // now safe",
        "            } else {",
        "              console.log(String(e));",
        "            }",
        "          }",
        "",
        "  Custom properties (e.g. .code, .status) — use `in` to narrow without `as any`:",
        "  Before: catch (error: any) { if (error.code === 503) { ... } }",
        "  After:  catch (error: unknown) {",
        "            if (error instanceof Error && 'code' in error && error.code === 503) {",
        "              // 'code' in error narrows to Error & Record<'code', unknown>",
        "            }",
        "          }",
        "",
        "  Utility helper (reusable):",
        "    function toError(e: unknown): Error {",
        "      return e instanceof Error ? e : new Error(String(e));",
        "    }",
        "    catch (e) { logger.error(toError(e)); }",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CatchClause(node: TSESTree.CatchClause) {
        const param = node.param;
        if (!param) return;

        // TypeScript catch params may have a type annotation via TSTypeAnnotation
        const annotated = param as TSESTree.BindingName & {
          typeAnnotation?: TSESTree.TSTypeAnnotation;
        };
        const annotation = annotated.typeAnnotation;
        if (!annotation) return;

        const typeNode = annotation.typeAnnotation;
        if (typeNode.type === AST_NODE_TYPES.TSAnyKeyword) {
          context.report({
            node: typeNode,
            messageId: "preferUnknownInCatch",
          });
        }
      },
    };
  },
});
