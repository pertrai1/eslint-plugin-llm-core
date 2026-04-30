# eslint-plugin-llm-core

## Why

Teaching-oriented ESLint plugin. Rules catch patterns LLM agents consistently
get wrong and provide structured error messages (what / why / how-to-fix) that
enable self-correction on the first attempt. Suggestions, not auto-fixes.
Deterministic feedback — every rule produces the same message for the same
mistake, every time.

## What

- TypeScript (strict mode), tsc → dist/ (`tsconfig.build.json`)
- vitest + `@typescript-eslint/rule-tester`
- ESLint flat config + Prettier
- Changesets for versioning, GitHub Actions CI (Node 20/22)
- Agent workflow directives in `.agents/directives/`
- Agent review/debugging skills in `.agents/skills/`

## Commands

| Command                      | Purpose                          |
| ---------------------------- | -------------------------------- |
| `npm run build`              | Compile TypeScript to `dist/`    |
| `npm run test`               | Run tests with vitest            |
| `npm run test:coverage`      | Run tests with coverage          |
| `npm run lint`               | Run ESLint                       |
| `npm run format`             | Run Prettier                     |
| `npm run format:check`       | Check formatting without writing |
| `npm run update:eslint-docs` | Regenerate rule docs             |

## Mandatory Workflow

**NEVER commit directly to `main`.** Work on a feature branch (`feat/rule-name`,
`fix/bug-description`, `docs/update-topic`). No exceptions.

**Load [`.agents/directives/adaptive-routing.md`](.agents/directives/adaptive-routing.md) first.**
It selects the lightest safe workflow, required directives/skills, and whether
[`.agents/directives/context-handoff.md`](.agents/directives/context-handoff.md)
is needed. Do not load every directive by default.

**Code changes follow one of these routed sequences:**

### Light Path

Use for low-risk, non-behavioral changes: typo fixes, docs-only edits,
formatting-only changes, comments, metadata-only edits, or small mechanical
changes with no rule logic, public API, type, or dependency change.

Do not use Light Path for bug fixes, behavior changes, new rules, rule option
changes, public API/export changes, dependency changes, or changes to generated
rule docs.

| Step | Phase        | Action                         | Verify                                                       |
| ---- | ------------ | ------------------------------ | ------------------------------------------------------------ |
| 0    | **BASELINE** | Verify starting state is clean | `git status --short`; run targeted baseline only if needed   |
| 1    | FIX          | Make the change                | Affected docs or files reviewed in context                   |
| 2    | GATES        | Run quality gates              | `npm run format:check` and targeted checks for touched files |
| 3    | COMMIT       | Atomic commit                  | One coherent change per commit                               |

### Full Path

Use for everything else: new rules, rule behavior changes, refactors, multi-file
changes, type changes, public exports/config changes, eval changes, or generated
doc changes.

No skipping steps:

| Step | Phase          | Action                                          | Verify                                                                                                                                                         |
| ---- | -------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| -1   | **ORIENT**     | **Navigate codebase safely**                    | See [`.agents/directives/codebase-navigation.md`](.agents/directives/codebase-navigation.md) (SAFE pattern)                                                    |
| -0.5 | **BOUNDARIES** | **Classify touched files and dependency edges** | See [`.agents/directives/architecture-boundaries.md`](.agents/directives/architecture-boundaries.md) when imports/exports/packages/shared utilities may change |
| 0    | **BASELINE**   | **Verify starting state is clean**              | `npm run build && npm run test && npm run lint` when practical; surface pre-existing failures before proceeding                                                |
| 1    | TYPES          | Define types/contracts first                    | `npm run build` or `npx tsc --noEmit` passes                                                                                                                   |
| 2    | RED            | Write ONE failing test                          | Targeted test fails for the intended reason                                                                                                                    |
| 3    | GREEN          | Write minimum code to pass                      | Targeted test passes, existing tests still pass, type-check passes                                                                                             |
| 4    | REFACTOR       | Clean up if needed                              | Tests and type-check still pass                                                                                                                                |
| 4.5  | **SELF-AUDIT** | **Triage weakest assumptions and anomalies**    | See [`.agents/skills/self-audit/SKILL.md`](.agents/skills/self-audit/SKILL.md)                                                                                 |
| 4.75 | **VERIFY**     | **Produce verification summary**                | See [`.agents/directives/verification.md`](.agents/directives/verification.md)                                                                                 |
| 5    | GATES          | Run quality gates                               | `npm run test && npm run lint && npm run build`                                                                                                                |
| 5.5  | DOCS/HANDOFF   | Regenerate docs and compact context when routed | `npm run update:eslint-docs` if rules changed; see [`.agents/directives/context-handoff.md`](.agents/directives/context-handoff.md)                            |
| 6    | COMMIT         | Atomic commit                                   | One behavior per commit                                                                                                                                        |

Steps 2–6 repeat for each behavior. Do not batch unrelated rule behaviors.

Commit cadence: a `test:` commit should precede every `feat:`/`fix:` commit for
behavior changes when practical. See commit message examples in
[`.github/copilot-instructions.md`](.github/copilot-instructions.md).

## Directives (Routed)

Run adaptive routing first, then load the directives selected for the task phase.
They govern **how** you work. Do not load unrelated directives just to satisfy ceremony.

| Directive                        | What it governs                                                                    | File                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Adaptive Routing                 | Selects workflow path and required directives/skills                               | [`.agents/directives/adaptive-routing.md`](.agents/directives/adaptive-routing.md)                                 |
| Codebase Navigation              | SAFE exploration before implementation, review, or unfamiliar work                 | [`.agents/directives/codebase-navigation.md`](.agents/directives/codebase-navigation.md)                           |
| Architecture Boundaries          | Preserve dependency DAG, public APIs, imports/exports, and package boundaries      | [`.agents/directives/architecture-boundaries.md`](.agents/directives/architecture-boundaries.md)                   |
| Exploration Mode                 | Pre-implementation investigation stance                                            | [`.agents/directives/exploration-mode.md`](.agents/directives/exploration-mode.md)                                 |
| Task Framing                     | Intake checklist for non-trivial, ambiguous, high-risk, or cross-cutting work      | [`.agents/directives/task-framing.md`](.agents/directives/task-framing.md)                                         |
| Specification-Driven Development | Written specs before larger rule/API changes where build-and-see would risk rework | [`.agents/directives/specification-driven-development.md`](.agents/directives/specification-driven-development.md) |
| Type-First Development           | Types/contracts before implementation                                              | [`.agents/directives/type-driven-development.md`](.agents/directives/type-driven-development.md)                   |
| Test-Driven Development          | RED/GREEN/REFACTOR for behavior-changing implementation and fixes                  | [`.agents/directives/test-driven-development.md`](.agents/directives/test-driven-development.md)                   |
| Verification Protocol            | Evidence of correctness before GATES and PRs                                       | [`.agents/directives/verification.md`](.agents/directives/verification.md)                                         |
| Error Memory                     | Persistent memory for repeated mistakes                                            | [`.agents/directives/error-memory.md`](.agents/directives/error-memory.md)                                         |
| Context Handoff                  | Compact current task state at phase/session boundaries                             | [`.agents/directives/context-handoff.md`](.agents/directives/context-handoff.md)                                   |
| Session Decisions                | Durable decision capture for repo policy/workflow changes                          | [`.agents/directives/session-decisions.md`](.agents/directives/session-decisions.md)                               |

## Skills (Mandatory When Routed)

Load the relevant skill selected by adaptive routing before performing any task it covers.

| Skill                          | When                                                                                                                  | File                                                                                                               |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Test Reviewer                  | Before writing or reviewing rule tests, eval tests, or test-like checklists                                           | [`.agents/skills/test-reviewer/SKILL.md`](.agents/skills/test-reviewer/SKILL.md)                                   |
| Spec Reviewer                  | Before merging when a written spec, issue, or requirements doc governs the change                                     | [`.agents/skills/spec-reviewer/SKILL.md`](.agents/skills/spec-reviewer/SKILL.md)                                   |
| Self-Audit                     | After REFACTOR, before VERIFY for Full Path work                                                                      | [`.agents/skills/self-audit/SKILL.md`](.agents/skills/self-audit/SKILL.md)                                         |
| Systematic Debugging           | Before fixing bugs, failing tests, CI/build failures, regressions, flaky behavior, or integration failures            | [`.agents/skills/systematic-debugging/SKILL.md`](.agents/skills/systematic-debugging/SKILL.md)                     |
| Architecture Boundary Reviewer | Before merging changes to imports, exports, package boundaries, shared utilities, or public API surfaces              | [`.agents/skills/architecture-boundary-reviewer/SKILL.md`](.agents/skills/architecture-boundary-reviewer/SKILL.md) |
| Codebase Health Reviewer       | Before merging TypeScript/JavaScript refactors, cleanup, shared utilities, or Fallow/static-analysis-relevant changes | [`.agents/skills/codebase-health-reviewer/SKILL.md`](.agents/skills/codebase-health-reviewer/SKILL.md)             |
| Code Review and Quality        | Before merging any implementation change when a general multi-axis review is needed                                   | [`.agents/skills/code-review-and-quality/SKILL.md`](.agents/skills/code-review-and-quality/SKILL.md)               |

## Task Framing (Mandatory for Non-Trivial Work)

Before implementing a non-trivial, ambiguous, high-risk, or cross-cutting task,
load and follow [`.agents/directives/task-framing.md`](.agents/directives/task-framing.md).
This directive defines the minimum framing checklist, when a proposal must
precede implementation, and which supporting docs are supplemental rather than binding.

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
