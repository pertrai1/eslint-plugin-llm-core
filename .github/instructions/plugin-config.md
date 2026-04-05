---
applyTo: "src/index.ts"
---

# Plugin Configuration

## Config Structure

Rules are organized into category objects in `src/index.ts`. Each category maps to a granular config that users can adopt independently.

| Category Object      | Config Name      | Purpose                                   |
| -------------------- | ---------------- | ----------------------------------------- |
| `complexityRules`    | `complexity`     | File/function length, nesting, params     |
| `typescriptRules`    | `typescript`     | TypeScript-specific type safety           |
| `bestPracticesRules` | `best-practices` | Error handling, async, logging            |
| `styleRules`         | `style`          | Naming, file naming, exports, returns     |
| `hygieneRules`       | `hygiene`        | LLM artifacts, inline disables, dead code |

## Adding a Rule to a Config

Add the rule to the appropriate category object:

```typescript
const bestPracticesRules: TSESLint.FlatConfig.Rules = {
  "llm-core/existing-rule": "error",
  "llm-core/new-rule": "error", // Add here
};
```

The `recommended` config is composed from all category objects. Adding a rule to a category object automatically includes it in `recommended`.

The `all` config auto-expands from `src/rules/index.ts` -- no manual registration needed.

## TypeScript-Only Rules

Rules that access TypeScript-specific AST nodes (e.g., `returnType`, `typeAnnotation`) must go in `typescriptOnlyRules`, which is scoped to `["**/*.ts", "**/*.tsx"]` only. This prevents false positives on JavaScript files.

## File Glob Constants

- `scriptFiles`: `["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs", "**/*.cjs"]`
- `tsFiles`: `["**/*.ts", "**/*.tsx"]`

## Config Aliases

`bestPractices` is a camelCase alias for `best-practices`. Both point to the same rules. If adding a new hyphenated config, include a camelCase alias for ergonomics.
