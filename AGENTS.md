# eslint-plugin-llm-core

## Why

Teaching-oriented ESLint plugin. Rules catch patterns LLM agents consistently
get wrong and provide structured error messages (what / why / how-to-fix) that
enable self-correction on the first attempt. Suggestions, not auto-fixes.
Deterministic feedback — every rule produces the same message for the same
mistake, every time.

## What

- TypeScript (strict mode), tsc → dist/ (tsconfig.build.json)
- vitest + @typescript-eslint/rule-tester
- ESLint flat config + Prettier
- Changesets for versioning, GitHub Actions CI (Node 20/22)

## Commands

| Command                      | Purpose                     |
| ---------------------------- | --------------------------- |
| `npm run build`              | Compile TypeScript to dist/ |
| `npm run test`               | Run tests with vitest       |
| `npm run test:coverage`      | Run tests with coverage     |
| `npm run lint`               | Run ESLint                  |
| `npm run format`             | Run Prettier                |
| `npm run update:eslint-docs` | Regenerate rule docs        |

## Mandatory Workflow

**NEVER commit directly to `main`.** Work on a feature branch (`feat/rule-name`, `fix/bug-description`, `docs/update-topic`). No exceptions.

**All code changes follow one of these sequences:**

### Light Path

Use when: ≤2 files changed, no new exports, no type changes, no rule logic.
Typical: typo fixes, one-line bug fixes, docs-only changes.

| Step | Phase        | Action                         | Verify                                            |
| ---- | ------------ | ------------------------------ | ------------------------------------------------- |
| 0    | **BASELINE** | Verify starting state is clean | `tsc --noEmit && npm test && npm run build` pass  |
| 1    | FIX          | Make the change                | Affected test passes (or no test needed for docs) |
| 2    | GATES        | Run quality gates              | `npm test && npm run lint && npm run build` pass  |
| 3    | COMMIT       | Atomic commit                  | One change per commit                             |

### Full Path

Use for: everything else — new rules, refactors, multi-file changes, type changes.

No skipping steps:

| Step | Phase        | Action                                   | Verify                                                                                                          |
| ---- | ------------ | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| -1   | **ORIENT**   | **Navigate codebase safely**             | **See [`.agents/directives/CODEBASE_NAVIGATION.md`](.agents/directives/CODEBASE_NAVIGATION.md) (SAFE pattern)** |
| 0    | **BASELINE** | **Verify starting state is clean**       | **`tsc --noEmit && npm test && npm run build` all pass — if not, surface the failure before proceeding**        |
| 1    | TYPES        | Define types in `types.ts` or co-located | `tsc --noEmit` passes                                                                                           |
| 2    | RED          | Write ONE failing test                   | Test fails                                                                                                      |
| 3    | GREEN        | Write minimum code to pass               | New test passes, all existing tests still pass, `tsc --noEmit` passes                                           |
| 4    | REFACTOR     | Clean up if needed                       | All tests still pass                                                                                            |
| 4.5  | **VERIFY**   | **Produce verification summary**         | **See [`.agents/directives/VERIFICATION.md`](.agents/directives/VERIFICATION.md) for protocol**                 |
| 5    | GATES        | Run quality gates                        | `npm test && npm run lint && npm run build`                                                                     |
| 5.5  | DOCS         | Regenerate rule docs (if rules changed)  | `npm run update:eslint-docs`, then commit                                                                       |
| 6    | COMMIT       | Atomic commit                            | One behavior per commit                                                                                         |

Steps 2–6 repeat for each behavior. Do not batch.

Commit cadence: `test:` commit must precede every `feat:` commit.
See commit message examples in [copilot-instructions.md](.github/copilot-instructions.md).

## Directives (Mandatory)

Read and follow every directive before implementing. They govern **how** you work.

| Directive               | What it governs                             | File                                                                                             |
| ----------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Codebase Navigation     | SAFE exploration before implementation      | [`.agents/directives/CODEBASE_NAVIGATION.md`](.agents/directives/CODEBASE_NAVIGATION.md)         |
| Error Memory            | Persistent memory for repeated mistakes     | [`.agents/directives/ERROR_MEMORY.md`](.agents/directives/ERROR_MEMORY.md)                       |
| Type-First Development  | Types before implementation                 | [`.agents/directives/TYPE_DRIVEN_DEVELOPMENT.md`](.agents/directives/TYPE_DRIVEN_DEVELOPMENT.md) |
| Test-Driven Development | RED/GREEN/REFACTOR for all code changes     | [`.agents/directives/TEST_DRIVEN_DEVELOPMENT.md`](.agents/directives/TEST_DRIVEN_DEVELOPMENT.md) |
| Verification Protocol   | Evidence of correctness before GATES        | [`.agents/directives/VERIFICATION.md`](.agents/directives/VERIFICATION.md)                       |
| Session Decisions       | Durable decision capture at task completion | [`.agents/directives/SESSION_DECISIONS.md`](.agents/directives/SESSION_DECISIONS.md)             |

## Skills (Mandatory)

Load the relevant skill before performing any task it covers.

| Skill         | When                                 | File                                                 |
| ------------- | ------------------------------------ | ---------------------------------------------------- |
| Test Reviewer | Before writing or reviewing any test | [`skills/test-reviewer.md`](skills/test-reviewer.md) |

## Rule Scope

Framework-agnostic rules for any TypeScript/JavaScript codebase. Before proposing,
triaging, or implementing a new rule, load
[rule-implementation.md](.github/instructions/rule-implementation.md) for acceptance
criteria and scope boundaries.

## Decision Log Lookup

Before changing repo policy, contributor workflow, rule-authoring conventions,
lint-message format, or any cross-cutting convention, scan frontmatter in
`docs/decisions/*.md` and load matching active entries. Progressive disclosure —
do not bulk-read every record.

## Scoped Instructions

Domain-specific instructions are loaded automatically by `applyTo` globs in `.github/instructions/`:

| File                     | Applies to            | Covers                                                        |
| ------------------------ | --------------------- | ------------------------------------------------------------- |
| `rule-implementation.md` | `src/rules/**/*.ts`   | Rule file pattern, message format, scope, acceptance criteria |
| `rule-tests.md`          | `tests/rules/**/*.ts` | Test file pattern, quality rules, TDD flow                    |
| `rule-docs.md`           | `docs/rules/**/*.md`  | Doc structure, auto-generated headers                         |
| `plugin-config.md`       | `src/index.ts`        | Category objects, recommended, TypeScript-only rules          |
| `pull-request.md`        | `**` (all files)      | PR template, checklist, agent disclosure                      |
