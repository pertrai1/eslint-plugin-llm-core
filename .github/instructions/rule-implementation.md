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

## Scope

This plugin ships **framework-agnostic** rules that apply to any TypeScript/JavaScript codebase. Rules must work without project-specific configuration to be included.

**Out of scope** (important patterns, but too project-specific):

- **Layer boundaries** (domain/presentation/infrastructure) — varies by architecture. Use [`eslint-plugin-boundaries`](https://github.com/javierbrea/eslint-plugin-boundaries) or [`eslint-plugin-import/no-restricted-paths`](https://github.com/import-js/eslint-plugin-import).
- **Factory-over-class enforcement** — depends on whether the project uses OOP or functional patterns.
- **DTO/schema collocation** — directory structure varies per project.

## Rule Acceptance Criteria

Before implementing a new rule, verify it satisfies all of the following:

1. **Common enough to matter** — The pattern appears often enough in LLM-written or real production code to justify a dedicated rule.
2. **Framework-agnostic** — The rule works across TypeScript/JavaScript codebases without assuming a specific framework, architecture, or directory layout.
3. **Deterministic and narrow** — The detection logic can be expressed as a precise AST check with clear pass/fail behavior.
4. **Low false-positive risk** — The proposal defines explicit scope boundaries and avoids flagging patterns whose intent cannot be inferred reliably.
5. **Not already covered well enough** — Existing ESLint, TypeScript, or ecosystem rules do not already solve the problem adequately, or this rule adds clear value through LLM-oriented teaching messages.
6. **Config placement is explicit** — The proposal states whether the rule belongs in `recommended`, `all`, or should remain out of bundled configs until proven.

## Registering the Rule

After creating the rule file, export it from `src/rules/index.ts`:

```typescript
export { default as "rule-name" } from "./rule-name";
```
