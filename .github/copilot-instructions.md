# Copilot Instructions for eslint-plugin-llm-core

## STOP — Read Before Writing Any Code

You MUST commit after every step. Do NOT batch work into a single commit.

### The Commit Cadence (non-negotiable)

For EACH behavior you implement:

```
1. Write ONE failing test     → run `npm test` → confirm it FAILS
   ⛔ STOP — commit: "test: failing test for <rule> <behavior>"

2. Write MINIMUM code to pass → run `npm test` → confirm ALL pass
   ⛔ STOP — commit: "feat: <rule> <behavior>"

3. Repeat from step 1 for the next behavior
```

**CI will reject your PR if it has `feat:` commits without `test:` commits.**

### Example (3 behaviors = 6 commits minimum)

```
test: failing test for no-foo default detection
feat: no-foo detects default case
test: failing test for no-foo custom option
feat: no-foo supports custom option
test: failing test for no-foo arrow function edge case
feat: no-foo handles arrow functions
```

If you produce a single commit like `feat: add no-foo rule` with everything inside, the PR will fail CI.

## What This Project Is

A framework-agnostic ESLint plugin (TypeScript, strict mode) that helps LLM agents self-correct. Rules use `@typescript-eslint/utils` and the visitor pattern over AST nodes.

## Commands

- `npm run build` — compile TypeScript to dist/
- `npm run test` — run tests with vitest
- `npm run lint` — run ESLint
- `npm run format` — run Prettier
- `npm run update:eslint-docs` — regenerate rule docs (run after adding/changing rules)

## Adding a New Rule

1. Create `src/rules/<rule-name>.ts` using `createRule` from `src/utils/create-rule.ts`
2. Export from `src/rules/index.ts` (alphabetical order)
3. Add to the appropriate category in `src/index.ts` (alphabetical order)
4. Add tests: `tests/rules/<rule-name>.test.ts`
5. Add docs: `docs/rules/<rule-name>.md`
6. Run `npm run update:eslint-docs`

## Forbidden

- `any` type or implicit `any`
- `Function` type
- `it.skip()` in tests
- `expect(true).toBe(true)` or fake assertions
- Writing implementation before a failing test exists
- Batching multiple behaviors into one commit
- Changing version fields in `package.json` or `package-lock.json`

## Pull Requests

**CI enforces these checks — your PR will not pass without them:**

1. Complete the **Checklist** in the PR template — every box checked
2. Complete the **Agent Disclosure** section — name yourself as agent, check every instruction file you loaded
3. Ensure `test:` commits exist before `feat:` commits
4. Do not modify version fields in `package-lock.json`

## Versioning

Use [Changesets](https://github.com/changesets/changesets). Never run `npm run version` locally. Push the changeset file and let CI handle it.
