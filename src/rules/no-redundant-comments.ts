import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "redundantComment";

type CandidateNode = TSESTree.Statement | TSESTree.VariableDeclaration;

const EXPLANATORY_PATTERNS = [
  /\bbecause\b/i,
  /\bso\s+that\b/i,
  /\bin\s+order\s+to\b/i,
  /\b(?:avoid|prevent|workaround|important|why)\b/i,
  /\b(?:only|when|unless|until)\b/i,
  /\b(?:race|bug|issue|security|compatibility)\b/i,
  /\b(?:must|cannot|should)\b/i,
];

const COMMENT_EXCLUSION_PATTERNS = [
  /^\s*eslint-/,
  /^\s*@ts-/,
  /^\s*@\w+/,
  /^\s*(?:TODO|FIXME|HACK|NOTE|XXX|REVIEW)\b/i,
  /https?:\/\//,
];

const VERB_PREFIXES = [
  "build",
  "calculate",
  "call",
  "check",
  "compute",
  "create",
  "delete",
  "fetch",
  "filter",
  "get",
  "handle",
  "initialize",
  "iterate",
  "load",
  "loop",
  "map",
  "parse",
  "process",
  "render",
  "return",
  "save",
  "send",
  "set",
  "sort",
  "update",
  "validate",
  "verify",
];

function normalizeComment(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function shouldSkipComment(text: string): boolean {
  if (text.length < 8) return true;
  if (COMMENT_EXCLUSION_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }
  return EXPLANATORY_PATTERNS.some((pattern) => pattern.test(text));
}

function getFirstWord(text: string): string | null {
  const match = /^(\w+)/.exec(text.trim().toLowerCase());
  return match?.[1] ?? null;
}

function isVerbLike(word: string | null): word is string {
  return word !== null && VERB_PREFIXES.includes(word);
}

function getPropertyName(node: TSESTree.MemberExpression): string | null {
  if (node.property.type === AST_NODE_TYPES.Identifier) {
    return node.property.name;
  }
  if (
    node.property.type === AST_NODE_TYPES.Literal &&
    typeof node.property.value === "string"
  ) {
    return node.property.value;
  }
  return null;
}

function getCalleeName(node: TSESTree.CallExpression): string | null {
  const callee = node.callee;
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return callee.name;
  }
  if (callee.type === AST_NODE_TYPES.MemberExpression) {
    return getPropertyName(callee);
  }
  return null;
}

function startsWithVerb(name: string | null, verb: string): boolean {
  return name?.toLowerCase().startsWith(verb) ?? false;
}

function expressionMatchesComment(
  expression: TSESTree.Expression,
  firstWord: string,
): boolean {
  if (expression.type === AST_NODE_TYPES.CallExpression) {
    return startsWithVerb(getCalleeName(expression), firstWord);
  }

  if (expression.type === AST_NODE_TYPES.AssignmentExpression) {
    return ["assign", "set", "update"].includes(firstWord);
  }

  if (expression.type === AST_NODE_TYPES.AwaitExpression) {
    return expressionMatchesComment(expression.argument, firstWord);
  }

  return false;
}

function commentDescribesNode(
  commentText: string,
  node: CandidateNode,
): boolean {
  const firstWord = getFirstWord(commentText);
  if (!isVerbLike(firstWord)) return false;

  switch (node.type) {
    case AST_NODE_TYPES.ReturnStatement:
      return firstWord === "return";
    case AST_NODE_TYPES.IfStatement:
      return ["check", "verify", "validate"].includes(firstWord);
    case AST_NODE_TYPES.ForStatement:
    case AST_NODE_TYPES.ForInStatement:
    case AST_NODE_TYPES.ForOfStatement:
    case AST_NODE_TYPES.WhileStatement:
      return ["process", "loop", "iterate"].includes(firstWord);
    case AST_NODE_TYPES.ExpressionStatement:
      return expressionMatchesComment(node.expression, firstWord);
    case AST_NODE_TYPES.VariableDeclaration:
      return [
        "build",
        "calculate",
        "compute",
        "create",
        "fetch",
        "get",
        "initialize",
        "load",
        "parse",
      ].includes(firstWord);
    default:
      return false;
  }
}

export default createRule<[], MessageIds>({
  name: "no-redundant-comments",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow comments that merely narrate the next line of code without adding intent",
    },
    messages: {
      redundantComment: [
        "This comment only narrates the code: '{{ comment }}'. Remove it or explain why the code exists.",
        "",
        "Why: LLMs often add conversational comments that restate obvious code actions.",
        "These comments make files noisier without preserving design intent, edge cases,",
        "or maintenance context.",
        "",
        "How to fix:",
        "  Delete comments that say what the next line already says.",
        "  Keep or rewrite comments that explain why, constraints, tradeoffs, or non-obvious behavior.",
        "    Before: // Validate the input",
        "    After:  // Reject webhook payloads before persistence because they are untrusted",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const statementsByStartLine = new Map<number, CandidateNode>();

    function rememberNode(node: CandidateNode): void {
      const line = node.loc.start.line;
      if (!statementsByStartLine.has(line)) {
        statementsByStartLine.set(line, node);
      }
    }

    return {
      ExpressionStatement: rememberNode,
      ForInStatement: rememberNode,
      ForOfStatement: rememberNode,
      ForStatement: rememberNode,
      IfStatement: rememberNode,
      ReturnStatement: rememberNode,
      VariableDeclaration: rememberNode,
      WhileStatement: rememberNode,
      "Program:exit"() {
        const comments = context.sourceCode.getAllComments();

        for (const comment of comments) {
          if (comment.type !== "Line") continue;

          const commentText = normalizeComment(comment.value);
          if (shouldSkipComment(commentText)) continue;

          const nextLineNode = statementsByStartLine.get(
            comment.loc.end.line + 1,
          );
          if (!nextLineNode) continue;

          if (commentDescribesNode(commentText, nextLineNode)) {
            context.report({
              loc: comment.loc,
              messageId: "redundantComment",
              data: { comment: commentText },
            });
          }
        }
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "No redundant narration comments — delete comments that only say what the adjacent code already says",
};
