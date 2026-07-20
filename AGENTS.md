# eslint-plugin-llm-core monorepo

## Five non-negotiables

- Surface assumptions before building. Wrong assumptions held silently are the most common failure mode.
- Stop and ask when requirements conflict. Don’t guess.
- Push back when warranted. The agent (or engineer) is not a yes-machine.
- Prefer the boring, obvious solution. Cleverness is expensive.
- Touch only what you’re asked to touch.

## Why

Teaching-oriented ESLint plugin. Rules catch patterns LLM agents consistently
get wrong and provide structured error messages (what / why / how-to-fix) that
enable self-correction on the first attempt. Suggestions, not auto-fixes.
Deterministic feedback — every rule produces the same message for the same
mistake, every time.

## What

- npm workspace monorepo rooted at `package.json` with packages in `packages/*`
- `packages/eslint-plugin`: published ESLint plugin (`eslint-plugin-llm-core`), CommonJS, TypeScript strict mode, vitest + `@typescript-eslint/rule-tester`
- `packages/mcp-server`: published MCP server (`eslint-plugin-llm-core-mcp`), ESM, embeds rule docs and depends on the plugin workspace
- `packages/quality-cli`: published quality CLI (`llm-core-quality`), ESM, orchestrates plugin/ESLint/Knip checks
- TypeScript package builds use each package's `tsconfig.build.json` and emit to that package's `dist/`
- ESLint flat config + Prettier at the repo root
- Changesets for versioning, GitHub Actions CI (Node 20/22)
- Agent workflow directives in `.agents/directives/`
- Agent review/debugging skills in `.agents/skills/`

## Commands

Run commands from the repository root unless a package workspace command is explicitly needed.

| Command                                                | Purpose                                               |
| ------------------------------------------------------ | ----------------------------------------------------- |
| `npm run build`                                        | Build all workspaces                                  |
| `npm run build:core`                                   | Build `packages/eslint-plugin` only                   |
| `npm run build:quality`                                | Build `packages/quality-cli` only                     |
| `npm --workspace eslint-plugin-llm-core-mcp run build` | Build `packages/mcp-server` only                      |
| `npm run test`                                         | Run all workspace tests                               |
| `npm run test:core`                                    | Run `packages/eslint-plugin` tests only               |
| `npm --workspace eslint-plugin-llm-core-mcp test`      | Run `packages/mcp-server` tests only                  |
| `npm --workspace llm-core-quality test`                | Run `packages/quality-cli` tests only                 |
| `npm run test:coverage`                                | Run coverage for the plugin and tests for other tools |
| `npm run lint`                                         | Run repo-wide ESLint                                  |
| `npm run format`                                       | Run repo-wide Prettier                                |
| `npm run format:check`                                 | Check repo-wide formatting without writing            |
| `npm run update:eslint-docs`                           | Regenerate plugin rule docs                           |

## Mandatory Workflow

**NEVER commit directly to `main`.** Work on a feature branch. No exceptions.

**Load `.agents/directives/adaptive-routing.md` first.**

The root file provides project-specific context plus compact routing pointers: commands, repo layout, local constraints, and any client-specific workflow reminders.

Workflow path selection, directive loading, skill loading, rule selection, and evidence requirements live in `.agents/directives/adaptive-routing.md`.
For ambiguous, composite, or high-risk routes, load its synced lazy companion at
`.agents/directives/references/adaptive-routing-detail.md`; obvious Light,
Review, and Exploration tasks do not preload it.

After routing, report:
`Route: <path>; using <directive/skill files>; rules: <rule files or none>; evidence: <checks>.`

When adaptive routing selects Full Path or another route that invokes the full
phase sequence, no skipping steps:

| Step | Phase          | Action                                                                         | Verify                                                                                                                   |
| ---- | -------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| -1   | **ORIENT**     | **Navigate codebase safely**                                                   | See `.agents/directives/codebase-navigation.md` (SAFE pattern)                                                           |
| -0.5 | **BOUNDARIES** | **Classify touched files and dependency edges**                                | See `.agents/directives/architecture-boundaries.md` when imports/exports/packages/shared code may change                 |
| 0    | **BASELINE**   | **Verify starting state is clean**                                             | <!-- FILL IN: baseline verification command --> all pass                                                                 |
| 0.5  | **SPEC**       | **Create or identify the durable written specification before implementation** | See `.agents/directives/specification-driven-development.md`; spec depth may scale, spec presence must not scale to zero |
| 1    | TYPES          | Define types first                                                             | Type-check passes                                                                                                        |
| 2    | RED            | Write ONE failing test                                                         | Test fails                                                                                                               |
| 3    | GREEN          | Write minimum code to pass                                                     | New test passes, all existing tests still pass, type-check passes                                                        |
| 4    | REFACTOR       | Clean up if needed                                                             | All tests still pass                                                                                                     |
| 4.5  | **SELF-AUDIT** | **Triage weakest assumptions and anomalies**                                   | See `.agents/skills/self-audit/SKILL.md` — route findings: 🔁 fix → step 2, 📋 document, or 🧑 ask human                 |
| 4.75 | **VERIFY**     | **Produce verification summary**                                               | See `.agents/directives/verification.md` for protocol — target 📋 documented Jenga entries                               |
| 5    | GATES          | Run quality gates                                                              | <!-- FILL IN: gates commands -->                                                                                         |
| 5.5  | **HANDOFF**    | **Compact current task state when routed**                                     | See `.agents/directives/context-handoff.md` for phase/session handoff                                                    |
| 6    | COMMIT         | Atomic commit                                                                  | One behavior, or one inseparable eligible batch                                                                          |

Steps 0.5-6 repeat for each behavior-changing slice. Do not batch unless the
router explicitly selects an eligible Small Batch; it still requires one durable
batch spec/matrix and focused proof for every row.

## Directives (Routed)

Run adaptive routing first, then load the directives selected for the task phase.
They govern **how** you work. Do not load unrelated directives just to satisfy ceremony.

| Directive                | What it governs                                                                         | File                                                     |
| ------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Adaptive Routing         | Selects workflow path and required directives/skills                                    | `.agents/directives/adaptive-routing.md`                 |
| Agent Permissions        | Defines agent read/write/command/network permission boundaries and escalation behavior  | `.agents/directives/agent-permissions.md`                |
| Workspace Isolation      | Protect mutable work with an isolated workspace; prefer native tools, then git fallback | `.agents/directives/workspace-isolation.md`              |
| Codebase Navigation      | SAFE exploration before implementation                                                  | `.agents/directives/codebase-navigation.md`              |
| Architecture Boundaries  | Preserve dependency DAG and import rules                                                | `.agents/directives/architecture-boundaries.md`          |
| Exploration Mode         | Pre-implementation investigation stance                                                 | `.agents/directives/exploration-mode.md`                 |
| Task Framing             | Intake checklist that hands off to specification-driven development                     | `.agents/directives/task-framing.md`                     |
| Specification-Driven Dev | Create or identify durable specs before implementation, verify after                    | `.agents/directives/specification-driven-development.md` |
| Type-First Development   | Types before implementation                                                             | `.agents/directives/type-driven-development.md`          |
| Test-Driven Development  | RED/GREEN/REFACTOR for behavior changes                                                 | `.agents/directives/test-driven-development.md`          |
| Verification Protocol    | Evidence of correctness before GATES                                                    | `.agents/directives/verification.md`                     |
| Error Memory             | Persistent memory for repeated mistakes                                                 | `.agents/directives/error-memory.md`                     |
| Context Handoff          | Compact current task state at phase/session boundaries                                  | `.agents/directives/context-handoff.md`                  |
| Session Decisions        | Durable decision capture at task completion                                             | `.agents/directives/session-decisions.md`                |

## Skills (Mandatory)

Load the relevant skill selected by adaptive routing before performing any task it covers.

| Skill                          | When                                                                                                                                                                                                                  | File                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Code Reviewer                  | Before reviewing PRs, branches, diffs, or local changes                                                                                                                                                               | `.agents/skills/code-reviewer/SKILL.md`                  |
| Adversarial Reviewer           | Before explicit adversarial/red-team/failure-mode review or high-risk, broad, or agent-authored changes needing a separate skeptical reviewer                                                                         | `.agents/skills/adversarial-reviewer/SKILL.md`           |
| Test Reviewer                  | Before writing or reviewing any test                                                                                                                                                                                  | `.agents/skills/test-reviewer/SKILL.md`                  |
| Spec Reviewer                  | Before merging when a written spec exists                                                                                                                                                                             | `.agents/skills/spec-reviewer/SKILL.md`                  |
| Product Requirements Writer    | Before turning a feature idea or vague requirement into a PRD/spec                                                                                                                                                    | `.agents/skills/product-requirements-writer/SKILL.md`    |
| Implementation Task Planner    | Before turning a PRD, issue, or acceptance criteria into implementation tasks                                                                                                                                         | `.agents/skills/implementation-task-planner/SKILL.md`    |
| Subagent-Driven Development    | Before executing an existing implementation plan through delegated subagents or isolated worker sessions                                                                                                              | `.agents/skills/subagent-driven-development/SKILL.md`    |
| Self-Audit                     | After REFACTOR, before VERIFY (every Full Path cycle)                                                                                                                                                                 | `.agents/skills/self-audit/SKILL.md`                     |
| Systematic Debugging           | Before fixing bugs, failing tests, CI failures, or regressions                                                                                                                                                        | `.agents/skills/systematic-debugging/SKILL.md`           |
| Architecture Boundary Reviewer | Before merging changes to imports, exports, packages, services, shared code, or folder boundaries                                                                                                                     | `.agents/skills/architecture-boundary-reviewer/SKILL.md` |
| Codebase Health Reviewer       | Before merging TypeScript/JavaScript refactors, cleanup, shared utilities, or Fallow-relevant changes                                                                                                                 | `.agents/skills/codebase-health-reviewer/SKILL.md`       |
| Production Readiness Reviewer  | Before merging/reviewing production-sensitive changes: persistence, external services, async jobs, auth/security/privacy, infra/config/deploy, critical user paths, performance/scale, or cross-service compatibility | `.agents/skills/production-readiness-reviewer/SKILL.md`  |
| Harness Hooks Reviewer         | Before adding/reviewing agent harness hooks, start/stop hooks, pre-action hooks, or deterministic agent automation                                                                                                    | `.agents/skills/harness-hooks-reviewer/SKILL.md`         |
| MCP Integration Reviewer       | Before adding/reviewing MCP servers/tools, agent tool schemas, internal API bridges, or write-capable agent tools                                                                                                     | `.agents/skills/mcp-integration-reviewer/SKILL.md`       |

## Task Framing (Mandatory for Non-Trivial Work)

Before implementing a non-trivial, ambiguous, or cross-cutting task, load and
follow `.agents/directives/task-framing.md`. This directive defines the minimum framing
checklist and hands behavior-changing work to
`.agents/directives/specification-driven-development.md` for the required durable
specification before implementation.

## Decision Log Lookup

Before changing repo policy, contributor workflow, or any cross-cutting
convention, scan frontmatter in `docs/decisions/*.md` and load matching active
entries. Progressive disclosure — do not bulk-read every record.## Scoped Instructions

Domain-specific instructions are loaded automatically by `applyTo` globs in `.github/instructions/`:

| File                     | Applies to                                   | Covers                                                        |
| ------------------------ | -------------------------------------------- | ------------------------------------------------------------- |
| `rule-implementation.md` | `packages/eslint-plugin/src/rules/**/*.ts`   | Rule file pattern, message format, scope, acceptance criteria |
| `rule-tests.md`          | `packages/eslint-plugin/tests/rules/**/*.ts` | Test file pattern, quality rules, TDD flow                    |
| `rule-docs.md`           | `packages/eslint-plugin/docs/rules/**/*.md`  | Doc structure, auto-generated headers                         |
| `plugin-config.md`       | `packages/eslint-plugin/src/index.ts`        | Category objects, recommended, TypeScript-only rules          |
| `pull-request.md`        | `**` (all files)                             | PR template, checklist, agent disclosure                      |
