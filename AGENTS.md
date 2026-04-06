# eslint-plugin-llm-core

## Mandatory: Read This First

**All code changes must follow this sequence — no skipping steps:**

| Step | Phase    | Action                                   | Verify                                                                |
| ---- | -------- | ---------------------------------------- | --------------------------------------------------------------------- |
| 1    | TYPES    | Define types in `types.ts` or co-located | `tsc --noEmit` passes                                                 |
| 2    | RED      | Write ONE failing test                   | Test fails                                                            |
| 3    | GREEN    | Write minimum code to pass               | New test passes, all existing tests still pass, `tsc --noEmit` passes |
| 4    | REFACTOR | Clean up if needed                       | All tests still pass                                                  |
| 5    | GATES    | Run quality gates                        | `npm test && npm run lint && npm run build`                           |
| 6    | COMMIT   | Atomic commit                            | One behavior per commit                                               |

**Steps 2–6 repeat for each behavior. Do not batch multiple behaviors into one cycle.**

**No skipping steps. No exceptions.**

**Commit examples (one per RED→GREEN→REFACTOR cycle):**

```bash
git commit -m "test: failing test for require-type-annotation return type check"
git commit -m "feat: require-type-annotation flags missing return types on exported functions"
git commit -m "test: failing test for require-type-annotation parameter type check"
git commit -m "feat: require-type-annotation flags missing parameter types"
git commit -m "test: failing test for require-type-annotation arrow and default export coverage"
git commit -m "feat: require-type-annotation handles arrow functions and default exports"
git commit -m "docs: add rule docs and register require-type-annotation in recommended"
```

If there is no `test:` commit before a `feat:` commit, the RED phase was skipped or batched.

See [TYPE_DRIVEN_DEVELOPMENT](.agents/directives/TYPE_DRIVEN_DEVELOPMENT.md), [TEST_DRIVEN_DEVELOPMENT](.agents/directives/TEST_DRIVEN_DEVELOPMENT.md), and [SESSION_DECISIONS](.agents/directives/SESSION_DECISIONS.md) for detailed guidance.

## Decision Log Lookup

Before changing repo policy, contributor workflow, rule-authoring conventions, lint-message format, or any other cross-cutting convention, scan the frontmatter in `docs/decisions/*.md` and load the active entries whose `domain`, `triggers`, or `applies_to` match the task. Use the decision logs for progressive disclosure; do not bulk-read every record by default.

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

Follow the [mandatory workflow above](#mandatory-read-this-first) for each step.

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

## Rule Acceptance Criteria

This section is the canonical source for deciding whether a proposed rule belongs in `eslint-plugin-llm-core`.

A new rule proposal must satisfy all of the following:

1. **Common enough to matter** — The pattern appears often enough in LLM-written or real production code to justify a dedicated rule.
2. **Framework-agnostic** — The rule works across TypeScript/JavaScript codebases without assuming a specific framework, architecture, or directory layout.
3. **Deterministic and narrow** — The detection logic can be expressed as a precise AST check with clear pass/fail behavior.
4. **Low false-positive risk** — The proposal defines explicit scope boundaries and avoids flagging patterns whose intent cannot be inferred reliably.
5. **Not already covered well enough** — Existing ESLint, TypeScript, or ecosystem rules do not already solve the problem adequately, or this rule adds clear value through LLM-oriented teaching messages.
6. **Config placement is explicit** — The proposal states whether the rule belongs in `recommended`, `all`, or should remain out of bundled configs until proven.

Use these criteria in issue triage, implementation review, and config-placement decisions.

## Skills (Mandatory)

**You MUST load and follow the relevant skill before performing any task it covers. These are not optional guidelines.**

| Skill         | When                                 | File                                                 |
| ------------- | ------------------------------------ | ---------------------------------------------------- |
| Test Reviewer | Before writing or reviewing any test | [`skills/test-reviewer.md`](skills/test-reviewer.md) |

## Directives (Mandatory)

**You MUST read and follow every directive listed below. These govern how you work, not what you build.**

| Directive               | What it governs                                                             | File                                                                                             |
| ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Type-First Development  | Types must be defined before implementation                                 | [`.agents/directives/TYPE_DRIVEN_DEVELOPMENT.md`](.agents/directives/TYPE_DRIVEN_DEVELOPMENT.md) |
| Test-Driven Development | RED/GREEN/REFACTOR cycle for all code changes                               | [`.agents/directives/TEST_DRIVEN_DEVELOPMENT.md`](.agents/directives/TEST_DRIVEN_DEVELOPMENT.md) |
| Session Decisions       | Capture durable repo/process and cross-cutting decisions at task completion | [`.agents/directives/SESSION_DECISIONS.md`](.agents/directives/SESSION_DECISIONS.md)             |

## Conventions

- All rules use `@typescript-eslint/utils` for typed ESLint utilities
- Rule files use `createRule` from `src/utils/create-rule.ts`
- Tests use `RuleTester` from `@typescript-eslint/rule-tester` with vitest
- One rule per file, filename matches rule name
- Error messages follow structured teaching format: what's wrong, why, and how to fix with concrete examples
- Rules provide suggestions (not auto-fixes) when the transformation could change semantics
