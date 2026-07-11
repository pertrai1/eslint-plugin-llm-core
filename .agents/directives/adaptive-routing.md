---
name: adaptive-routing
description: Selects the lightest safe workflow path, relevant directives/skills, and handoff requirements based on task intent, risk, and touched surfaces.
version: 1.9.1
required: true
category: workflow
tools:
  - claude
  - copilot
  - codex
  - cursor
triggers:
  - every-task
  - workflow-selection
  - directive-selection
routing:
  load: first
  applies_to:
    - implementation
    - debugging
    - review
    - exploration
    - policy-change
---

# Adaptive Workflow Routing Directive

**When to load:** Load this directive first for every task, before task framing,
implementation, debugging, review, or exploration.

The router selects the lightest workflow that still proves safety. Do not load
every directive by default. Load the directives and skills required by the task
intent, risk level, and touched surfaces.

---

## Router Output

After routing, briefly display the active workflow path and directive/skill files
being used so reviewers can verify the agent loaded the expected guidance. Keep
this as routing evidence, not ceremony. When a harness or runtime provides logs,
treat its loaded-file manifest as authoritative for which directive files were
actually presented; the agent's route disclosure is useful self-report, not proof
of internal model attention.

For tiny low-risk edits, one sentence is enough:

```md
Route: Light Path; using `directives/adaptive-routing.md`; no additional directives or skills required.
```

Before major edits, output a short route decision:

```md
## Workflow Route

- Intent: <feature | bug-fix | refactor | docs | review | exploration | policy-change | mechanical>
- Path: <Light | Full | Debugging | Boundary | Workspace Isolation | Review | Exploration | Policy> or combined paths
- Risk: <low | medium | high> with reason
- Required directives: <paths>
- Required skills: <paths, if any>
- Selected rules: <rule paths, if any>
- Evidence required: <tests/checks/proofs>
- Handoff required: <yes/no and why>
- Confirmation needed: <yes/no and why>
```

For any non-trivial, ambiguous, high-risk, or cross-cutting task, use the full
block.

---

## Core Routing Rules

1. **Start with project instructions.** Load project-level instructions first
   (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, or equivalent).
2. **Pick the lightest safe path.** Do not apply Full Path ceremony to purely
   mechanical or docs-only work.
3. **Escalate by risk.** User requests like "quickly" or "just" do not downgrade
   safety for behavior, security, data, public API, or boundary changes.
4. **Combine paths when needed.** A bug fix that changes imports uses Debugging
   Path plus Boundary Path. A policy change with docs edits uses Policy Path plus
   Light Path gates. Mutable work from a shared checkout may add Workspace
   Isolation to the base path.
5. **Prefer evidence over ritual.** Do not emit boilerplate sections with no
   information. Show the proof that matches the selected path.
6. **Compact context at boundaries.** Use `directives/context-handoff.md` when
   switching major phases, handing work to another session/agent, or continuing
   long-running work where stale context could drift.
7. **Ask only when necessary.** If classification is uncertain and affects safety
   or scope, ask one concise clarifying question. Otherwise choose the safer path
   and state the assumption.
8. **Bound the implementation.** Prefer the smallest safe change that satisfies
   the task. Do not expand scope, rewrite adjacent code, introduce abstractions,
   apply drive-by formatting, perform whole-file rewrites, or fix unrelated
   issues unless current evidence requires it or the user explicitly requests it.

---

## Composite Task Routing

For non-trivial requests with multiple intents, decompose before selecting skills:

1. Split the request into atomic work items, where each item should need one
   primary directive, skill, or rule family.
2. Map each item to matching workflow paths, skills, and rules using the skill
   discovery map plus available manifest, rule, and frontmatter metadata.
3. Compose the final route by merging required paths and ordering dependent work.
   For debugging tasks that require regression coverage and boundary review, use
   this order: reproduce → add or update the failing regression test → fix →
   rerun the test → boundary review before merge readiness.
4. If the first decomposition uses vague steps like "fix issue" or "review
   code," revise it using the names and descriptions of matching directives,
   skills, or rules.
5. Do not load all matched candidates. Load selected files only; when ambiguity
   matters, state why near-matches were not loaded.

---

## Skill Discovery Map

Use this map after selecting the workflow path. Do not rely on inference when a
listed situation matches: load every matching skill before performing work it
covers. The path column shows where the situation commonly appears; it is not a
filter that prevents loading a matched skill when paths are combined or escalated.
If no row matches, state that no specialist skill is required.

| Situation / intent                                                                                                                                                          | Common path(s)              | Required skill                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------ |
| Vague feature idea, product request, or unclear requirement needs a PRD/spec                                                                                                | Exploration / Full / Policy | `skills/product-requirements-writer/SKILL.md`    |
| PRD, issue, spec, or acceptance criteria needs implementation tasks                                                                                                         | Exploration / Full / Policy | `skills/implementation-task-planner/SKILL.md`    |
| Executing an existing implementation plan with multiple mostly independent tasks using delegated subagents or isolated worker sessions                                      | Full / Debugging / Policy   | `skills/subagent-driven-development/SKILL.md`    |
| Bug, regression, failing test, failing CI/build/lint/type-check, or unexpected behavior                                                                                     | Debugging                   | `skills/systematic-debugging/SKILL.md`           |
| Reviewing a PR, branch, diff, or local changes                                                                                                                              | Review                      | `skills/code-reviewer/SKILL.md`                  |
| Writing, changing, or reviewing tests/eval scenarios                                                                                                                        | Full / Review               | `skills/test-reviewer/SKILL.md`                  |
| Implementation must be checked against a written spec/PRD                                                                                                                   | Full / Review               | `skills/spec-reviewer/SKILL.md`                  |
| Imports, exports, package boundaries, folders, services, shared utilities, or dependency direction change                                                                   | Boundary / Review           | `skills/architecture-boundary-reviewer/SKILL.md` |
| TypeScript/JavaScript refactor, cleanup, shared utilities, dead-code, duplication, complexity, or static-analysis health concern                                            | Full / Review               | `skills/codebase-health-reviewer/SKILL.md`       |
| Persistence, external services, async jobs, auth/security/privacy, infra/config/deploy, critical user paths, performance/scale, or cross-service compatibility              | Full / Debugging / Review   | `skills/production-readiness-reviewer/SKILL.md`  |
| Agent harness hooks, start/stop hooks, pre-action hooks, post-change automation, or deterministic agent workflow scripts are added or reviewed                              | Full / Review / Policy      | `skills/harness-hooks-reviewer/SKILL.md`         |
| MCP servers/tools, agent-accessible internal APIs, structured search, docs/ticketing/analytics connectors, tool schemas, or write-capable agent tools are added or reviewed | Full / Review / Policy      | `skills/mcp-integration-reviewer/SKILL.md`       |
| Full Path work reaches post-REFACTOR pre-verification checkpoint                                                                                                            | Full                        | `skills/self-audit/SKILL.md`                     |

---

## Rule Selection

After selecting the workflow path and skills, select stack or project rules only
when they match detected project evidence or touched files. Rules constrain the
work but do not replace directives or skills.

- Treat `rules/` entries as lazy-loaded standards, not always-loaded context.
- Load framework rules when project evidence matches, such as `angular.json` or
  `@angular/core` for Angular, and the task touches relevant framework files.
- Load file-scoped rules when touched paths match their `applies_to` frontmatter.
- List selected rule files separately from directives and skills in route output.
- Do not load unrelated framework rule packs. Project-local instructions override
  rule-pack guidance when they conflict.

### Selecting rules by discovery

Do not maintain a per-rule routing table in this directive. Rule packs grow, and
this directive loads on every task; an inline catalog would put every rule pack's
metadata in always-loaded context. Discover matching rules on demand instead:

1. **Detect the stack** from project evidence. For example, `angular.json` or an
   `@angular/core` dependency selects the `angular` pack, while `pyproject.toml` or
   `requirements.txt` selects the `python` pack.
2. **Inspect available rule metadata.** Use `manifest.json` as a compact package
   index when it is available, but do not assume it was installed into the target
   repo. The authoritative scope lives in each `rules/<pack>/*.md` file's
   frontmatter: `category` identifies the pack, `description` says what it
   governs, and `applies_to` lists the file globs it scopes to.
3. **Match before loading.** Load a rule only when its `applies_to` globs match a
   file you will touch _and_ its `description` is relevant to what the task
   actually changes. A glob match alone is not enough — editing a
   `*.component.ts` file does not pull in the security rule unless the task
   involves untrusted input, HTTP, secrets, or SSR.
4. **Skip absent packs.** Do not load a pack whose evidence is missing, and do
   not load a whole pack by default.

Active packs include `rules/angular/` and `rules/python/`.

---

## Workflow Paths

### Light Path

Use for low-risk, non-behavioral changes:

- typo fixes
- docs wording edits
- comments
- formatting-only changes
- metadata changes that do not affect runtime, build, tests, packaging, or public API

Required:

- minimal orientation
- make the change
- run the relevant project quality gate when available
- provide concise verification
- skip handoff unless work will continue in another session or the user requests it

Do **not** use Light Path for bug fixes, behavior changes, public API changes,
dependency changes, boundary changes, or security/data/auth work.

### Full Path

Use for normal implementation work:

- new features
- behavior changes
- meaningful refactors
- tests added or changed for behavior
- type/API changes

Required directives:

- `directives/codebase-navigation.md`
- `directives/task-framing.md` when non-trivial, ambiguous, high-risk, or cross-cutting
- `directives/type-driven-development.md` for typed projects or public contracts
- `directives/test-driven-development.md` for behavior-changing code
- `directives/agent-permissions.md` when work touches protected files, risky commands, package manager operations, deployment, infrastructure, secrets, CI, or repo policy
- `directives/verification.md`
- `directives/context-handoff.md` when switching major phases or handing off work

Required skills:

- `skills/product-requirements-writer/SKILL.md` when turning a feature idea or vague request into a PRD/spec before planning
- `skills/implementation-task-planner/SKILL.md` when turning a PRD/spec/issue into an implementation task list
- `skills/subagent-driven-development/SKILL.md` when executing an existing implementation plan through delegated subagents or isolated worker sessions
- `skills/self-audit/SKILL.md` after REFACTOR for Full Path work
- `skills/test-reviewer/SKILL.md` when tests are added or substantially changed
- `skills/spec-reviewer/SKILL.md` when reviewing implementation against a written spec or preparing spec-governed work for merge
- `skills/production-readiness-reviewer/SKILL.md` before merge/review when a change touches persistence, external services, async jobs, auth/security/privacy, infra/config/deploy, critical user paths, performance/scale, or cross-service compatibility
- `skills/harness-hooks-reviewer/SKILL.md` when the implementation adds or changes agent harness hooks or deterministic agent automation
- `skills/mcp-integration-reviewer/SKILL.md` when the implementation adds or changes MCP servers/tools, agent tool schemas, or agent-accessible internal API bridges

### Debugging Path

Use for:

- bugs
- failing tests
- failing CI/build/lint/type-check
- regressions
- flaky or unexpected behavior

Required:

- `skills/systematic-debugging/SKILL.md`
- reproduce the failure before changing code
- add or identify a failing regression test when behavior changed
- use `directives/test-driven-development.md` for the fix when production behavior changes
- use `directives/verification.md` for fix proof and no-regression evidence
- use `directives/context-handoff.md` after reproduction, before a risky fix, or before resuming in a new session

### Boundary Path

Add this path whenever the task touches:

- imports or exports
- folder/module/package moves
- public entry points
- shared utilities
- service/package boundaries
- dependency direction or architecture rules

Required:

- `directives/architecture-boundaries.md`
- `skills/architecture-boundary-reviewer/SKILL.md` before merge/review
- boundary proof in `directives/verification.md`
- compact changed dependency-edge evidence with `directives/context-handoff.md` before boundary review or session transfer

### Workspace Isolation Path

Add this path whenever the task will mutate a git-backed repository from a
checkout that may be shared or unsafe to edit in place, especially when:

- the current branch is `main`, `master`, `trunk`, or another protected/default branch
- the working tree has unrelated local changes
- the user asks to protect the current workspace
- a native workspace tool or `git worktree` can provide clean isolation

Required:

- `directives/workspace-isolation.md`
- detect existing isolation before creating anything
- prefer native workspace tools over manual `git worktree`
- ask before creating a new isolated workspace when preference is unknown
- show either isolated-workspace proof or an explicit fallback reason before editing

### Review Path

Use when the user asks to review a PR, branch, diff, or local changes.

Required skills:

- `skills/code-reviewer/SKILL.md` for baseline PR/branch/diff/local-change review
- `skills/test-reviewer/SKILL.md` for tests
- `skills/spec-reviewer/SKILL.md` for spec-backed work
- `skills/architecture-boundary-reviewer/SKILL.md` for imports/exports/packages/shared code
- `skills/codebase-health-reviewer/SKILL.md` for TypeScript/JavaScript refactors, cleanup, shared utilities, or Fallow-relevant changes
- `skills/production-readiness-reviewer/SKILL.md` for production-sensitive changes involving persistence, external services, async jobs, auth/security/privacy, infra/config/deploy, critical user paths, performance/scale, or cross-service compatibility
- `skills/harness-hooks-reviewer/SKILL.md` for agent harness hooks or deterministic agent automation
- `skills/mcp-integration-reviewer/SKILL.md` for MCP servers/tools, agent tool schemas, or agent-accessible internal API bridges

Do not edit code during Review Path unless the user asks for fixes. Use `directives/context-handoff.md` for compact PR/review handoffs when review findings will be fixed later or transferred to another session.

### Exploration Path

Use when the user asks to investigate, compare options, explain, research, or
think through an approach.

Required:

- `directives/exploration-mode.md`
- `directives/codebase-navigation.md` when repo context is needed
- `skills/product-requirements-writer/SKILL.md` when the exploration output is a PRD/spec
- `skills/implementation-task-planner/SKILL.md` when the exploration output is an implementation task list

Do not edit files during Exploration Path unless the user explicitly switches to
implementation. Use `directives/context-handoff.md` when exploration produces decisions, constraints, or risks that an implementation session should inherit.

### Policy Path

Use for changes to:

- directives or skills
- repo workflow
- contributor instructions
- architecture policy
- cross-cutting conventions

Required:

- `directives/task-framing.md`
- proposal before major edits when tradeoffs exist
- bump the frontmatter `version` for every existing `directives/*.md` or `skills/*/SKILL.md` file changed in the PR; use patch for wording/behavior tightening, minor for new heuristics/routing/evidence coverage, and major for incompatible routing/schema/path changes; raw deletions are rejected, so deprecate with a major version bump before deletion
- `directives/session-decisions.md` if the accepted change establishes or changes durable policy
- `directives/verification.md` before PR
- `directives/context-handoff.md` for multi-phase directive/workflow changes or new-session handoff
- `skills/harness-hooks-reviewer/SKILL.md` when policy changes affect agent harness hooks or deterministic automation
- `skills/mcp-integration-reviewer/SKILL.md` when policy changes affect MCP/tool surfaces exposed to agents

---

## Risk Escalation

Escalate to Full Path or add a specialized path when any of these are true:

| Risk trigger                                                                                                               | Add                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Auth, permissions, security, privacy, payments, data loss                                                                  | Full Path + Production Readiness Review + stronger verification; load `directives/agent-permissions.md`            |
| Database schema, migrations, persistence, queues                                                                           | Full Path + Production Readiness Review + explicit rollback/edge-case proof                                        |
| External services, async jobs, infra/config/deploy, critical user paths, performance/scale, or cross-service compatibility | Full Path + Production Readiness Review                                                                            |
| Protected files, risky commands, package manager operations, deploys, infra, secrets, CI, or repo policy changes           | Load `directives/agent-permissions.md`; escalate per its protocol before proceeding                                |
| Agent harness hooks or deterministic agent automation                                                                      | Policy/Full/Review Path + Harness Hooks Review                                                                     |
| MCP servers/tools, agent-accessible APIs, or write-capable agent tools                                                     | Policy/Full/Review Path + MCP Integration Review; add Production Readiness Review for sensitive production systems |
| Public API, exported types, package entry points                                                                           | Full Path + Integration Proof + Boundary Path                                                                      |
| Imports, shared utilities, packages, folders, services                                                                     | Boundary Path                                                                                                      |
| Shared/default checkout, unrelated local changes, or explicit request for isolation before repo edits                      | Workspace Isolation Path                                                                                           |
| Failing CI/test/build/lint/type-check                                                                                      | Debugging Path                                                                                                     |
| Cross-cutting policy or workflow                                                                                           | Policy Path                                                                                                        |
| Large diff or broad refactor                                                                                               | Full Path + Self-Audit + Codebase Health Review + Context Handoff                                                  |

---

## Tool Feedback Handling

Run project-native quality gates selected by the route. Treat lint, type-check,
build, test, static-analysis, and review-bot output as implementation feedback.
Fix root causes rather than suppressing rules, weakening config, or making
superficial edits. If a finding is pre-existing or outside scope, document that
classification and avoid making the current change worse.

---

## Override Rules

- User may request a lighter or heavier workflow.
- Honor explicit user workflow preferences unless they would skip necessary
  safety evidence for high-risk work.
- If the user asks for a quick fix to a risky area, keep the route safe and make
  the implementation small.
- If the router chooses a heavier path than requested, state why in one sentence.

---

## Forbidden Patterns

| Pattern                                                            | Why Forbidden                                      |
| ------------------------------------------------------------------ | -------------------------------------------------- |
| Loading every directive or rule by default                         | Wastes context and creates compliance theater      |
| Using Light Path for behavior or bug fixes                         | Skips necessary proof                              |
| Treating "quick" as permission to skip safety                      | Risk depends on impact, not wording                |
| Producing boilerplate verification with no evidence                | Ritual is not proof                                |
| Appending active handoffs forever                                  | Recreates context drift under a different filename |
| Ignoring lint/type/test/build feedback as "just tooling"           | Tool output is implementation feedback             |
| Adding cross-cutting tooling/config as a drive-by change           | Policy changes need explicit review                |
| Opportunistic refactors or cleanup outside the task                | Increases review surface and hides behavior risk   |
| Adding abstractions for hypothetical future use                    | Produces unnecessary code and weakens local fit    |
| Printing or rewriting whole files when a targeted patch would work | Wastes context and increases accidental churn      |

---

## Quick Reference

| Intent                                  | Default path                             | Evidence                                                                                |
| --------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------- |
| Docs/typo/comment only                  | Light                                    | diff + relevant gate                                                                    |
| New feature                             | Full                                     | RED/GREEN, functional proof, gates                                                      |
| Bug/regression                          | Debugging + TDD                          | reproduction, failing test/command, fix proof                                           |
| Refactor                                | Full                                     | no-behavior-change proof, tests, gates                                                  |
| Import/export/package/shared change     | Boundary + relevant base path            | boundary proof                                                                          |
| Repo edits from shared/default checkout | relevant base path + Workspace Isolation | isolation proof or explicit fallback                                                    |
| PR/diff review                          | Review                                   | structured findings                                                                     |
| PRD/spec writing                        | Exploration                              | product requirements writer, essential questions, no code edits                         |
| PRD/spec/issue to task list             | Exploration                              | implementation task planner, repo-grounded file/test/validation tasks, no code edits    |
| Investigation/explanation               | Exploration                              | repo evidence, no edits                                                                 |
| Directive/workflow/policy change        | Policy                                   | proposal/tradeoffs, verification, handoff for multi-phase work, decision log if durable |
