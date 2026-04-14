import { createRule } from "../utils/create-rule";

type MessageIds = "maxComplexity";

type Options = [
  {
    max?: number;
    skipTestFiles?: boolean;
  },
];

export default createRule<Options, MessageIds>({
  name: "max-complexity",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce a maximum cyclomatic complexity per function to encourage decomposition",
    },
    messages: {
      maxComplexity: [
        "Function '{{ name }}' has a complexity of {{ count }}, exceeding the maximum of {{ max }}.",
        "",
        "Why: Each branching path is an independent surface for logic errors — high-complexity functions are harder to test and modify safely.",
        "",
        "How to fix:",
        "  Replace branching logic with a data structure.",
        "  Before: if (type === 'a') return 1; else if (type === 'b') return 2; else if (type === 'c') return 3;",
        "  After:  const VALUES: Record<string, number> = { a: 1, b: 2, c: 3 };",
        "          function getValue(type: string): number { return VALUES[type] ?? 0; }",
      ].join("\n"),
    },
    schema: [
      {
        type: "object",
        properties: {
          max: {
            type: "integer",
            minimum: 1,
            description: "Maximum allowed cyclomatic complexity (default: 10)",
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
    defaultOptions: [{ max: 10, skipTestFiles: true }],
  },
  defaultOptions: [{ max: 10, skipTestFiles: true }],
  create() {
    return {};
  },
});
