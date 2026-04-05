---
applyTo: "src/rules/**/*.ts"
---

# Rule Implementation

## Rule File Pattern

Every rule uses `createRule` from `src/utils/create-rule.ts`. One rule per file, filename matches rule name.

```typescript
import { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds = "messageIdHere";

export default createRule<[], MessageIds>({
  name: "rule-name",
  meta: {
    type: "problem", // or "suggestion"
    docs: {
      description: "Brief description of what the rule does",
    },
    messages: {
      messageIdHere: [
        "What's wrong — one-line summary.",
        "",
        "Why: Explanation of why this is a problem.",
        "",
        "How to fix:",
        "  Example fix 1: ...",
        "  Example fix 2: ...",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      // AST visitor methods keyed by node type
    };
  },
});
```

## Error Message Format

Messages use a structured teaching format with three sections:

1. **What's wrong** -- one-line summary of the violation
2. **Why** -- explain why this pattern is problematic (especially for LLM-generated code)
3. **How to fix** -- concrete code examples showing the correct approach

Messages are joined with `\n` via `.join("\n")` on an array of strings.

## Key Conventions

- Use `@typescript-eslint/utils` for all AST types (`TSESTree`, `AST_NODE_TYPES`)
- Rules return an object of AST visitor methods (visitor pattern)
- Provide suggestions (not auto-fixes) when the transformation could change semantics
- Define `MessageIds` as a union type to constrain available message keys
- Use `context.report()` with `node` and `messageId` (use `data` for interpolation when needed)

## Registering the Rule

After creating the rule file, export it from `src/rules/index.ts`:

```typescript
export { default as "rule-name" } from "./rule-name";
```
