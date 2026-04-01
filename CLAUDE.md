# eslint-plugin-llm-core

## Project Overview

Custom ESLint plugin designed to help LLM agents self-correct and learn from mistakes.

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Build**: tsc → dist/
- **Test**: vitest + @typescript-eslint/rule-tester
- **Lint**: ESLint (flat config) + Prettier
- **CI**: GitHub Actions (Node 18/20/22)
- **Versioning**: Changesets

## Commands

- `npm run build` — Compile TypeScript to dist/
- `npm run test` — Run tests with vitest
- `npm run test:coverage` — Run tests with coverage
- `npm run lint` — Run ESLint
- `npm run format` — Run Prettier
- `npm run update:eslint-docs` — Regenerate rule docs

## Adding a New Rule

1. Create rule file: `src/rules/my-rule.ts`
2. Export from `src/rules/index.ts`
3. Add tests: `tests/rules/my-rule.test.ts`
4. Add docs: `docs/rules/my-rule.md`
5. Run `npm run update:eslint-docs` to update README

## Conventions

- All rules use `@typescript-eslint/utils` for typed ESLint utilities
- Rule files use `createRule` from `@typescript-eslint/utils/eslint-utils`
- Tests use `RuleTester` from `@typescript-eslint/rule-tester` with vitest
- One rule per file, filename matches rule name
