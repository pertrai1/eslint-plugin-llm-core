import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "noLlmArtifact" | "notImplementedStub";

/**
 * Patterns that indicate LLM placeholder comments.
 * Each regex is tested against the trimmed comment text.
 */
const PLACEHOLDER_PATTERNS = [
  // Ellipsis placeholders: "... existing code ...", "...rest of the code..."
  /\.{3}\s*(?:existing|rest of|remaining|previous|other)\b/i,
  // "remains the same" variants
  /\bremains?\s+the\s+same\b/i,
  // Lazy TODO: "TODO: implement" or "TODO implement" with no specifics
  /\bTODO:?\s+implement\b(?:\s+this)?$/i,
  // "add implementation here", "your code here", "implementation goes here"
  /\b(?:add|your|put)\s+(?:\w+\s+)*(?:implementation|code)\s+here\b/i,
  /\bimplementation\s+goes\s+here\b/i,
  // "add X as needed" — vague deferred work
  /\badd\s+\w+(?:\s+\w+)*\s+as\s+needed\b/i,
  // "abbreviated/omitted/truncated for brevity/clarity"
  /\b(?:abbreviated|omitted|truncated|removed)\s+for\s+(?:brevity|clarity|readability|simplicity)\b/i,
  // "similar to above", "same as before/above"
  /\b(?:similar\s+to\s+above|same\s+(?:as\s+(?:before|above)|pattern\s+as\s+above))\b/i,
  // "continue from here", "continue implementation here"
  /\bcontinue\s+(?:\w+\s+)*here\b/i,
  // "see implementation above", "see above for details" — short, context-free references only
  /\bsee\s+(?:(?:implementation|example|code|details)\s+)?(?:above|below)(?:\s+for\s+\w+)?\s*$/i,
];

function isPlaceholderComment(text: string): boolean {
  const trimmed = text.trim();
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export default createRule<[], MessageIds>({
  name: "no-llm-artifacts",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow common LLM placeholder comments and incomplete code markers that indicate skipped implementation",
    },
    messages: {
      notImplementedStub: [
        "Function body is a 'not implemented' stub — write the actual implementation.",
        "",
        "Why: Stub functions that only throw 'not implemented' are placeholders left by",
        "incomplete code generation. They compile and pass type checks, but fail at runtime.",
        "This makes them especially dangerous — the error only surfaces when the code runs.",
        "",
        "How to fix:",
        "  Replace the stub with the actual implementation.",
        "  If the function genuinely cannot be implemented yet, document why:",
        '    Before: throw new Error("Not implemented");',
        '    After:  throw new Error("Streaming responses require WebSocket support (#456)");',
      ].join("\n"),
      noLlmArtifact: [
        "LLM placeholder detected: '{{ text }}'. Replace with actual implementation.",
        "",
        "Why: LLM-generated placeholders like '// ... existing code ...' or",
        "'// TODO: implement' indicate incomplete output. When applied to a codebase,",
        "these comments replace real logic with nothing, causing silent breakage.",
        "",
        "How to fix:",
        "  Remove the placeholder and write the actual implementation.",
        "  If the original code should be preserved, restore it in full.",
        "  If work is genuinely deferred, write a specific TODO:",
        "    Before: // TODO: implement",
        "    After:  // TODO(#123): validate input against schema before saving",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const NOT_IMPLEMENTED_PATTERN =
      /^(?:not\s+implemented|todo:?\s+implement)/i;

    function isNotImplementedThrow(node: TSESTree.Statement): boolean {
      if (node.type !== AST_NODE_TYPES.ThrowStatement) return false;
      const argument = node.argument;
      if (
        argument?.type !== AST_NODE_TYPES.NewExpression ||
        argument.callee.type !== AST_NODE_TYPES.Identifier ||
        argument.callee.name !== "Error"
      )
        return false;
      const firstArg = argument.arguments[0];
      if (firstArg?.type !== AST_NODE_TYPES.Literal) return false;
      return (
        typeof firstArg.value === "string" &&
        NOT_IMPLEMENTED_PATTERN.test(firstArg.value)
      );
    }

    function checkFunctionBody(body: TSESTree.BlockStatement): void {
      if (body.body.length !== 1) return;
      const stmt = body.body[0];
      // throw new Error("not implemented") as sole statement
      if (isNotImplementedThrow(stmt)) {
        context.report({
          node: stmt,
          messageId: "notImplementedStub",
        });
        return;
      }
    }

    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration) {
        if (node.body) checkFunctionBody(node.body);
      },
      FunctionExpression(node: TSESTree.FunctionExpression) {
        checkFunctionBody(node.body);
      },
      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression) {
        if (node.body.type === AST_NODE_TYPES.BlockStatement) {
          checkFunctionBody(node.body);
        }
      },
      Program() {
        const sourceCode = context.sourceCode;
        const comments = sourceCode.getAllComments();

        for (const comment of comments) {
          if (isPlaceholderComment(comment.value)) {
            const text = comment.value.trim();
            const truncated =
              text.length > 60 ? text.slice(0, 60) + "..." : text;

            context.report({
              loc: comment.loc,
              messageId: "noLlmArtifact",
              data: { text: truncated },
            });
          }
        }
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "No LLM placeholder comments or incomplete code markers — write the actual implementation",
};
