import path from "path";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "maxFileLength";

type Options = [
  {
    max?: number;
    skipBlankLines?: boolean;
    skipTestFiles?: boolean;
  },
];

export const instruction: RuleInstruction = {
  principle:
    "Keep files under {max} lines — split modules when they exceed this",
};

export default createRule<Options, MessageIds>({
  name: "max-file-length",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce a maximum number of lines per file to encourage proper module separation",
    },
    messages: {
      maxFileLength: [
        "File has {{ lines }} lines, exceeding the maximum of {{ max }}.",
        "",
        "Why: Oversized files usually mix responsibilities, so the next safe edit becomes hard to localize.",
        "",
        "How to fix:",
        "  Move one responsibility at a time into a sibling module.",
        "  Before: order-service.ts contains types, validation, formatting, and persistence.",
        "  After:  order-service.ts keeps orchestration; move validation to order-validation.ts and types to order.types.ts.",
        "  Then repeat until the file only owns one clear responsibility.",
      ].join("\n"),
    },
    schema: [
      {
        type: "object",
        properties: {
          max: {
            type: "integer",
            minimum: 1,
            description: "Maximum allowed lines per file (default: 250)",
          },
          skipBlankLines: {
            type: "boolean",
            description:
              "Whether to skip blank lines when counting (default: true)",
          },
          skipTestFiles: {
            type: "boolean",
            description:
              "Whether to skip test files (.test.ts, .spec.ts) (default: true)",
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ max: 250, skipBlankLines: true, skipTestFiles: true }],
  },
  defaultOptions: [{ max: 250, skipBlankLines: true, skipTestFiles: true }],
  create(context, [options]) {
    const max = options.max ?? 250;
    const skipBlankLines = options.skipBlankLines ?? true;
    const skipTestFiles = options.skipTestFiles ?? true;
    const sourceCode = context.sourceCode;

    return {
      "Program:exit"(node) {
        if (skipTestFiles) {
          const filename = path.basename(context.filename);
          if (/\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filename)) {
            return;
          }
        }

        const text = sourceCode.getText(node);
        const allLines = text.split("\n");
        const lines = skipBlankLines
          ? allLines.filter((line) => line.trim().length > 0).length
          : allLines.length;

        if (lines <= max) return;

        context.report({
          node,
          loc: { line: 1, column: 0 },
          messageId: "maxFileLength",
          data: {
            lines: String(lines),
            max: String(max),
          },
        });
      },
    };
  },
});
