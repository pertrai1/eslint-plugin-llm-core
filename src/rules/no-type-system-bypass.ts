import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds =
  | "doubleAssertion"
  | "explicitAny"
  | "nonNullAssertion"
  | "tsIgnoreDirective"
  | "unexplainedTsExpectError";

type NodeWithParent = TSESTree.Node & {
  parent?: NodeWithParent;
};

type TypeAssertionExpression =
  | TSESTree.TSAsExpression
  | TSESTree.TSTypeAssertion;

const GENERIC_TS_EXPECT_ERROR_REASONS = new Set([
  "fixme",
  "ignore",
  "temporary",
  "todo",
  "type error",
]);

function getParent(node: TSESTree.Node): NodeWithParent | undefined {
  return (node as NodeWithParent).parent;
}

function isAssertionTypeAnnotation(node: TSESTree.Node): boolean {
  const parent = getParent(node);
  return (
    parent?.type === AST_NODE_TYPES.TSAsExpression ||
    parent?.type === AST_NODE_TYPES.TSTypeAssertion
  );
}

function isCatchParameterAnnotation(node: TSESTree.Node): boolean {
  const annotation = getParent(node);
  const binding = annotation ? getParent(annotation) : undefined;
  const catchClause = binding ? getParent(binding) : undefined;

  return (
    annotation?.type === AST_NODE_TYPES.TSTypeAnnotation &&
    catchClause?.type === AST_NODE_TYPES.CatchClause
  );
}

function isGenericTypeArgument(node: TSESTree.Node): boolean {
  let current = getParent(node);

  while (current) {
    if (current.type === AST_NODE_TYPES.TSTypeParameterInstantiation) {
      return true;
    }

    if (
      current.type === AST_NODE_TYPES.TSTypeAnnotation ||
      current.type === AST_NODE_TYPES.TSAsExpression ||
      current.type === AST_NODE_TYPES.TSTypeAssertion
    ) {
      return false;
    }

    current = getParent(current);
  }

  return false;
}

function isUnknownAssertion(node: TSESTree.Node): boolean {
  return (
    (node.type === AST_NODE_TYPES.TSAsExpression ||
      node.type === AST_NODE_TYPES.TSTypeAssertion) &&
    node.typeAnnotation.type === AST_NODE_TYPES.TSUnknownKeyword
  );
}

function hasUnknownDoubleAssertion(node: TypeAssertionExpression): boolean {
  return (
    node.typeAnnotation.type !== AST_NODE_TYPES.TSUnknownKeyword &&
    isUnknownAssertion(node.expression)
  );
}

function normalizeComment(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function formatComment(comment: TSESTree.Comment): string {
  const value = normalizeComment(comment.value).split("\n")[0]!.trim();
  return comment.type === "Line" ? `// ${value}` : `/* ${value} */`;
}

function isJSDocStyleBlockComment(comment: TSESTree.Comment): boolean {
  return comment.type === "Block" && comment.value.trimStart().startsWith("*");
}

function getTsExpectErrorReason(commentText: string): string | null {
  const match = /^@ts-expect-error(?:\s+TS\d+:?)?\s*(.*)$/iu.exec(commentText);
  return match?.[1]?.trim() ?? null;
}

function hasSpecificTsExpectErrorReason(commentText: string): boolean {
  const reason = getTsExpectErrorReason(commentText);
  if (!reason) return false;

  const normalized = reason
    .replace(/^[-:–—\s]+/u, "")
    .replace(/[.。]+$/u, "")
    .trim()
    .toLowerCase();

  if (normalized.length < 10) return false;
  return !GENERIC_TS_EXPECT_ERROR_REASONS.has(normalized);
}

export default createRule<[], MessageIds>({
  name: "no-type-system-bypass",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow broad TypeScript escape hatches that hide type errors instead of fixing them",
    },
    messages: {
      tsIgnoreDirective: [
        "Do not use '{{ comment }}' — it suppresses TypeScript diagnostics without proof the next line is intentionally exceptional.",
        "",
        "Why: LLMs often silence compiler errors with `@ts-ignore` instead of understanding the type model.",
        "That leaves the original bug in place and makes future edits trust code the compiler could not verify.",
        "",
        "How to fix:",
        "  Fix the underlying type mismatch, add a precise runtime guard, or use a justified `@ts-expect-error` with a specific reason.",
      ].join("\n"),
      unexplainedTsExpectError: [
        "`{{ comment }}` needs a specific explanation for the expected TypeScript error.",
        "",
        "Why: An unexplained suppression is indistinguishable from an LLM shortcut that hid a real type problem.",
        "A useful `@ts-expect-error` documents the external bug or compatibility edge that makes the diagnostic intentional.",
        "",
        "How to fix:",
        "  Prefer fixing the type error. If the suppression is truly required, include the diagnostic and reason:",
        "  // @ts-expect-error TS2345: upstream package types reject documented runtime option",
      ].join("\n"),
      doubleAssertion: [
        "Avoid double assertions through `unknown` — they bypass TypeScript's structural checks.",
        "",
        "Why: `value as unknown as Target` tells the compiler to forget what it knows, then trust the target type.",
        "This is a common LLM escape hatch when a direct assertion fails.",
        "",
        "How to fix:",
        "  Use a parser, schema, type guard, or narrower adapter that proves the value actually has the target shape.",
      ].join("\n"),
      nonNullAssertion: [
        "Avoid non-null assertions (`!`) — prove the value exists before using it.",
        "",
        "Why: `!` suppresses null and undefined checks without changing runtime behavior.",
        "If the value is absent, the code still fails later, only with less context.",
        "",
        "How to fix:",
        "  Add an explicit guard, throw a domain-specific error, or model the value as required earlier in the flow.",
      ].join("\n"),
      explicitAny: [
        "Avoid explicit `any` annotations — use `unknown`, a specific type, or a generic constraint instead.",
        "",
        "Why: `any` opts out of type checking for that value and everything that flows from it.",
        "LLMs often introduce `any` to silence errors instead of preserving the codebase's type contract.",
        "",
        "How to fix:",
        "  Use `unknown` at trust boundaries and narrow it, or define the concrete shape the code expects.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (isJSDocStyleBlockComment(comment)) continue;

          const text = normalizeComment(comment.value);
          if (/^@ts-ignore\b/u.test(text)) {
            context.report({
              loc: comment.loc,
              messageId: "tsIgnoreDirective",
              data: { comment: formatComment(comment) },
            });
            continue;
          }

          if (
            /^@ts-expect-error\b/u.test(text) &&
            !hasSpecificTsExpectErrorReason(text)
          ) {
            context.report({
              loc: comment.loc,
              messageId: "unexplainedTsExpectError",
              data: { comment: formatComment(comment) },
            });
          }
        }
      },
      TSAnyKeyword(node: TSESTree.TSAnyKeyword) {
        if (
          isAssertionTypeAnnotation(node) ||
          isCatchParameterAnnotation(node) ||
          isGenericTypeArgument(node)
        ) {
          return;
        }

        context.report({
          node,
          messageId: "explicitAny",
        });
      },
      TSAsExpression(node: TSESTree.TSAsExpression) {
        if (hasUnknownDoubleAssertion(node)) {
          context.report({
            node,
            messageId: "doubleAssertion",
          });
        }
      },
      TSTypeAssertion(node: TSESTree.TSTypeAssertion) {
        if (hasUnknownDoubleAssertion(node)) {
          context.report({
            node,
            messageId: "doubleAssertion",
          });
        }
      },
      TSNonNullExpression(node: TSESTree.TSNonNullExpression) {
        context.report({
          node,
          messageId: "nonNullAssertion",
        });
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Do not bypass the TypeScript type system with suppression comments, double assertions, non-null assertions, or explicit any annotations",
};
