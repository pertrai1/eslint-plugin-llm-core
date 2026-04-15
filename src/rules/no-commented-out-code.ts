import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "noCommentedOutCode";

// Patterns that strongly indicate commented-out code
const CODE_PATTERNS = [
  // Variable declarations
  /^\s*(const|let|var)\s+\w+\s*[=:]/,
  // Function/class declarations
  /^\s*(async\s+)?function\s+\w+/,
  /^\s*class\s+\w+/,
  // Import/export
  /^\s*(import|export)\s+/,
  // Control flow with parens
  /^\s*(if|for|while|switch)\s*\(/,
  // Return/throw with value
  /^\s*(return|throw)\s+\S/,
  // Assignment ending with semicolon
  /^\s*\w[\w.[\]]*\s*=[^=].*;\s*$/,
  // Function/method call ending with semicolon
  /^\s*\w[\w.]*\(.*\)\s*;\s*$/,
  // Try-catch
  /^\s*try\s*\{/,
  /^\s*\}\s*catch\s*\(/,
  // Await expression with semicolon
  /^\s*await\s+\w/,
];

// Patterns that indicate this is NOT commented-out code
const EXCLUSION_PATTERNS = [
  /^\s*eslint-disable/,
  /^\s*eslint-enable/,
  /^\s*@ts-/,
  /^\s*@\w+/, // JSDoc tags
  /https?:\/\//, // URLs
  /^\s*(TODO|FIXME|HACK|NOTE|XXX|REVIEW)\b/i,
];

function isCodeLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3) return false;
  if (EXCLUSION_PATTERNS.some((p) => p.test(trimmed))) return false;
  return CODE_PATTERNS.some((p) => p.test(trimmed));
}

function containsCode(text: string): boolean {
  const lines = text.split("\n");
  return lines.some((line) => isCodeLine(line));
}

export default createRule<[], MessageIds>({
  name: "no-commented-out-code",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow commented-out code to keep the codebase clean and reduce noise",
    },
    messages: {
      noCommentedOutCode: [
        "This comment appears to contain commented-out code. Remove it.",
        "",
        "Why: Commented-out code is dead code that adds noise and confusion.",
        "It creates uncertainty about whether it should be restored, was left by mistake,",
        "or is an abandoned alternative. Git preserves history — deleted code can always be recovered.",
        "",
        "How to fix:",
        "  Delete the commented-out code entirely.",
        "  If the code is needed for reference, link to the relevant commit or PR instead.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Program() {
        const sourceCode = context.sourceCode;
        const comments = sourceCode.getAllComments();

        const processed = new Set<(typeof comments)[number]>();

        for (let i = 0; i < comments.length; i++) {
          const comment = comments[i];
          if (processed.has(comment)) continue;
          processed.add(comment);

          if (comment.type === "Block") {
            // Skip JSDoc comments (start with *)
            if (comment.value.trimStart().startsWith("*")) continue;

            if (containsCode(comment.value)) {
              context.report({
                loc: comment.loc,
                messageId: "noCommentedOutCode",
              });
            }
          } else {
            // Line comment — group consecutive line comments
            const group = [comment];

            let j = i + 1;
            while (j < comments.length) {
              const next = comments[j];
              const prev = group[group.length - 1];
              if (
                next.type === "Line" &&
                next.loc.start.line === prev.loc.end.line + 1
              ) {
                group.push(next);
                processed.add(next);
                j++;
              } else {
                break;
              }
            }

            const groupText = group.map((c) => c.value).join("\n");
            if (containsCode(groupText)) {
              context.report({
                loc: {
                  start: group[0].loc.start,
                  end: group[group.length - 1].loc.end,
                },
                messageId: "noCommentedOutCode",
              });
            }
          }
        }
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle: "No commented-out code — delete it, git preserves history",
};
