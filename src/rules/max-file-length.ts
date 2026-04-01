import path from "path";
import { createRule } from "../utils/create-rule";

type MessageIds = "maxFileLength";

type Options = [
  {
    max?: number;
    skipBlankLines?: boolean;
    skipTestFiles?: boolean;
  },
];

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
        "Why: Large files are hard to navigate and often contain unrelated logic.",
        "They indicate poor module separation and make code review harder.",
        "",
        "How to fix:",
        "  1. Split the file by responsibility — each file should have a clear, single purpose",
        "  2. Extract related functions into their own module (e.g., validation.ts, formatting.ts)",
        "  3. Move types/interfaces to a separate types.ts file",
        "  4. Move constants to a constants.ts file",
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
