# Copilot Instructions for eslint-plugin-llm-core

## What This Project Is

An npm workspace monorepo for a framework-agnostic ESLint plugin and related tooling that helps LLM agents self-correct.

- `packages/eslint-plugin` (`eslint-plugin-llm-core`): plugin source, rules, rule tests, and generated rule docs. Rules use `@typescript-eslint/utils` and the visitor pattern over AST nodes.
- `packages/mcp-server` (`eslint-plugin-llm-core-mcp`): MCP server that embeds plugin rule docs and depends on the plugin workspace.
- `packages/quality-cli` (`llm-core-quality`): quality CLI that orchestrates the plugin, ESLint, and Knip checks.

Run commands from the repository root unless a package-specific workspace command is explicitly required.

## STOP — Read Before Writing Any Code

You MUST commit after every step. Do NOT batch work into a single commit.

### BASELINE (before starting work)

Run `npm run lint && npm run test && npm run build`. If any fails, stop and report before proceeding. For a narrow package-only task, you may first run the relevant workspace test/build command, but final gates must include repo-wide lint and any affected dependent workspace.

### The Commit Cadence (non-negotiable)

For EACH behavior you implement:

```text
1. Write ONE failing test     → run the relevant workspace test command → confirm it FAILS
   ⛔ STOP — verify ONLY test files are staged (no `packages/*/src/` changes)
   ⛔ STOP — commit: "test: failing test for <rule> <behavior>"

2. Write MINIMUM code to pass → run the relevant workspace test command → confirm ALL affected tests pass
   ⛔ STOP — commit: "feat: <rule> <behavior>"

3. Repeat from step 1 for the next behavior
```

**CI will reject your PR if it has `feat:` commits without `test:` commits.**

### Example (3 behaviors = 6 commits minimum)

```text
test: failing test for no-foo default detection
feat: no-foo detects default case
test: failing test for no-foo custom option
feat: no-foo supports custom option
test: failing test for no-foo arrow function edge case
feat: no-foo handles arrow functions
```

If you produce a single commit like `feat: add no-foo rule` with everything inside, the PR will fail CI.

### VERIFY (before GATES, after implementation)

Before running final gates (`npm run lint && npm run test && npm run build` or justified package-scoped equivalents plus repo lint), produce a verification summary following `.agents/directives/verification.md`.

## Commands

- `npm run build` — build all workspaces
- `npm run build:core` — build `packages/eslint-plugin`
- `npm --workspace eslint-plugin-llm-core-mcp run build` — build `packages/mcp-server`
- `npm run build:quality` — build `packages/quality-cli`
- `npm run test` — run all workspace tests with vitest
- `npm run test:core` — run `packages/eslint-plugin` tests
- `npm --workspace eslint-plugin-llm-core-mcp test` — run `packages/mcp-server` tests
- `npm --workspace llm-core-quality test` — run `packages/quality-cli` tests
- `npm run lint` — run repo-wide ESLint
- `npm run format` — run repo-wide Prettier
- `npm run update:eslint-docs` — regenerate plugin rule docs (run after adding/changing plugin rules)

## Adding a New Plugin Rule

All plugin rule paths are under `packages/eslint-plugin`:

1. Create `packages/eslint-plugin/src/rules/<rule-name>.ts` using `createRule` from `packages/eslint-plugin/src/utils/create-rule.ts`
2. Export from `packages/eslint-plugin/src/rules/index.ts` (alphabetical order)
3. Add to the appropriate category in `packages/eslint-plugin/src/index.ts` (alphabetical order)
4. Add tests: `packages/eslint-plugin/tests/rules/<rule-name>.test.ts`
5. Add docs: `packages/eslint-plugin/docs/rules/<rule-name>.md`
6. Run `npm run update:eslint-docs` from the repo root

## Forbidden

- `any` type or implicit `any`
- `Function` type
- `it.skip()` in tests
- `expect(true).toBe(true)` or fake assertions
- Writing implementation before a failing test exists in the affected workspace
- Batching multiple behaviors into one commit
- Changing version fields in any `package.json` or `package-lock.json`

## Pull Requests

**CI enforces these checks — your PR will not pass without them:**

1. Complete the **Checklist** in the PR template — every box checked
2. Complete the **Agent Disclosure** section — name yourself as agent, check every instruction file you loaded
3. Ensure `test:` commits exist before `feat:` commits
4. Do not modify version fields in `package-lock.json` or workspace `package.json` files

## Versioning

Use [Changesets](https://github.com/changesets/changesets). Never run `npm run version` locally. Push the changeset file and let CI handle it.
