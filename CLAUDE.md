# eslint-plugin-llm-core

## Project Overview

Custom ESLint plugin designed to help LLM agents self-correct and learn from mistakes.

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Build**: tsc → dist/ (uses tsconfig.build.json)
- **Test**: vitest + @typescript-eslint/rule-tester
- **Lint**: ESLint (flat config) + Prettier
- **CI**: GitHub Actions (Node 20/22)
- **Versioning**: Changesets

## Commands

- `npm run build` — Compile TypeScript to dist/ (uses tsconfig.build.json)
- `npm run test` — Run tests with vitest
- `npm run test:coverage` — Run tests with coverage
- `npm run lint` — Run ESLint
- `npm run format` — Run Prettier
- `npm run update:eslint-docs` — Regenerate rule docs

## Adding a New Rule

1. Create rule file: `src/rules/my-rule.ts` using `createRule` from `src/utils/create-rule.ts`
2. Export from `src/rules/index.ts`
3. If the rule belongs in `recommended`, add it to `recommendedRules` in `src/index.ts`
4. Add tests: `tests/rules/my-rule.test.ts`
5. Add docs: `docs/rules/my-rule.md`
6. Run `npm run update:eslint-docs` to update README and rule docs

## Configs

- **`recommended`** — Manually curated safe defaults. New rules must be explicitly added to `recommendedRules` in `src/index.ts`.
- **`all`** — Every rule at `error`. Auto-expands as rules are added to `src/rules/index.ts`.

## Scope

This plugin ships **framework-agnostic** rules that apply to any TypeScript/JavaScript codebase. Rules must work without project-specific configuration to be included.

**Out of scope** (important patterns, but too project-specific):

- **Layer boundaries** (domain/presentation/infrastructure) — varies by architecture. Use [`eslint-plugin-boundaries`](https://github.com/javierbrea/eslint-plugin-boundaries) or [`eslint-plugin-import/no-restricted-paths`](https://github.com/import-js/eslint-plugin-import).
- **Factory-over-class enforcement** — depends on whether the project uses OOP or functional patterns.
- **DTO/schema collocation** — directory structure varies per project.

These are valid architectural constraints for individual projects, but they belong in project-specific ESLint configs, not in a general-purpose plugin.

## Conventions

- All rules use `@typescript-eslint/utils` for typed ESLint utilities
- Rule files use `createRule` from `src/utils/create-rule.ts`
- Tests use `RuleTester` from `@typescript-eslint/rule-tester` with vitest
- One rule per file, filename matches rule name
- Error messages follow structured teaching format: what's wrong, why, and how to fix with concrete examples
- Rules provide suggestions (not auto-fixes) when the transformation could change semantics
