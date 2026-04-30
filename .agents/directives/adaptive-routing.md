---
name: adaptive-routing
description: Selects the lightest safe workflow path, relevant directives/skills, and handoff requirements based on task intent, risk, and touched surfaces.
version: 1.0.0
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

Before major edits, output a short route decision:

```md
## Workflow Route

- Intent: <feature | bug-fix | refactor | docs | review | exploration | policy-change | mechanical>
- Path: <Light | Full | Debugging | Boundary | Review | Exploration | Policy> or combined paths
- Risk: <low | medium | high> with reason
- Required directives: <paths>
- Required skills: <paths, if any>
- Evidence required: <tests/checks/proofs>
- Handoff required: <yes/no and why>
- Confirmation needed: <yes/no and why>
```

For tiny low-risk edits, the route can be one or two sentences instead of a full
block. For any non-trivial, ambiguous, high-risk, or cross-cutting task, use the
full block.

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
   Light Path gates.
5. **Prefer evidence over ritual.** Do not emit boilerplate sections with no
   information. Show the proof that matches the selected path.
6. **Compact context at boundaries.** Use `.agents/directives/context-handoff.md` when
   switching major phases, handing work to another session/agent, or continuing
   long-running work where stale context could drift.
7. **Ask only when necessary.** If classification is uncertain and affects safety
   or scope, ask one concise clarifying question. Otherwise choose the safer path
   and state the assumption.

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

- `.agents/directives/codebase-navigation.md`
- `.agents/directives/task-framing.md` when non-trivial, ambiguous, high-risk, or cross-cutting
- `.agents/directives/type-driven-development.md` for typed projects or public contracts
- `.agents/directives/test-driven-development.md` for behavior-changing code
- `.agents/directives/verification.md`
- `.agents/directives/context-handoff.md` when switching major phases or handing off work

Required skills:

- `.agents/.agents/skills/self-audit/SKILL.md` after REFACTOR for Full Path work
- `.agents/.agents/skills/test-reviewer/SKILL.md` when tests are added or substantially changed
- `.agents/.agents/skills/spec-reviewer/SKILL.md` when a written spec exists

### Debugging Path

Use for:

- bugs
- failing tests
- failing CI/build/lint/type-check
- regressions
- flaky or unexpected behavior

Required:

- `.agents/.agents/skills/systematic-debugging/SKILL.md`
- reproduce the failure before changing code
- add or identify a failing regression test when behavior changed
- use `.agents/directives/test-driven-development.md` for the fix when production behavior changes
- use `.agents/directives/verification.md` for fix proof and no-regression evidence
- use `.agents/directives/context-handoff.md` after reproduction, before a risky fix, or before resuming in a new session

### Boundary Path

Add this path whenever the task touches:

- imports or exports
- folder/module/package moves
- public entry points
- shared utilities
- service/package boundaries
- dependency direction or architecture rules

Required:

- `.agents/directives/architecture-boundaries.md`
- `.agents/.agents/skills/architecture-boundary-reviewer/SKILL.md` before merge/review
- boundary proof in `.agents/directives/verification.md`
- compact changed dependency-edge evidence with `.agents/directives/context-handoff.md` before boundary review or session transfer

### Review Path

Use when the user asks to review a PR, branch, diff, or local changes.

Required skills depend on changed surfaces:

- `.agents/.agents/skills/test-reviewer/SKILL.md` for tests
- `.agents/.agents/skills/spec-reviewer/SKILL.md` for spec-backed work
- `.agents/.agents/skills/architecture-boundary-reviewer/SKILL.md` for imports/exports/packages/shared code
- `.agents/.agents/skills/codebase-health-reviewer/SKILL.md` for TypeScript/JavaScript refactors, cleanup, shared utilities, or Fallow-relevant changes

Do not edit code during Review Path unless the user asks for fixes. Use `.agents/directives/context-handoff.md` for compact PR/review handoffs when review findings will be fixed later or transferred to another session.

### Exploration Path

Use when the user asks to investigate, compare options, explain, research, or
think through an approach.

Required:

- `.agents/directives/exploration-mode.md`
- `.agents/directives/codebase-navigation.md` when repo context is needed

Do not edit files during Exploration Path unless the user explicitly switches to
implementation. Use `.agents/directives/context-handoff.md` when exploration produces decisions, constraints, or risks that an implementation session should inherit.

### Policy Path

Use for changes to:

- directives or skills
- repo workflow
- contributor instructions
- architecture policy
- cross-cutting conventions

Required:

- `.agents/directives/task-framing.md`
- proposal before major edits when tradeoffs exist
- `.agents/directives/session-decisions.md` if the accepted change establishes or changes durable policy
- `.agents/directives/verification.md` before PR
- `.agents/directives/context-handoff.md` for multi-phase directive/workflow changes or new-session handoff

---

## Risk Escalation

Escalate to Full Path or add a specialized path when any of these are true:

| Risk trigger                                              | Add                                                               |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| Auth, permissions, security, privacy, payments, data loss | Full Path + stronger verification                                 |
| Database schema, migrations, persistence, queues          | Full Path + explicit rollback/edge-case proof                     |
| Public API, exported types, package entry points          | Full Path + Integration Proof + Boundary Path                     |
| Imports, shared utilities, packages, folders, services    | Boundary Path                                                     |
| Failing CI/test/build/lint/type-check                     | Debugging Path                                                    |
| Cross-cutting policy or workflow                          | Policy Path                                                       |
| Large diff or broad refactor                              | Full Path + Self-Audit + Codebase Health Review + Context Handoff |

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

| Pattern                                                  | Why Forbidden                                      |
| -------------------------------------------------------- | -------------------------------------------------- |
| Loading every directive by default                       | Wastes context and creates compliance theater      |
| Using Light Path for behavior or bug fixes               | Skips necessary proof                              |
| Treating "quick" as permission to skip safety            | Risk depends on impact, not wording                |
| Producing boilerplate verification with no evidence      | Ritual is not proof                                |
| Appending active handoffs forever                        | Recreates context drift under a different filename |
| Ignoring lint/type/test/build feedback as "just tooling" | Tool output is implementation feedback             |
| Adding cross-cutting tooling/config as a drive-by change | Policy changes need explicit review                |

---

## Quick Reference

| Intent                              | Default path                  | Evidence                                                                                |
| ----------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| Docs/typo/comment only              | Light                         | diff + relevant gate                                                                    |
| New feature                         | Full                          | RED/GREEN, functional proof, gates                                                      |
| Bug/regression                      | Debugging + TDD               | reproduction, failing test/command, fix proof                                           |
| Refactor                            | Full                          | no-behavior-change proof, tests, gates                                                  |
| Import/export/package/shared change | Boundary + relevant base path | boundary proof                                                                          |
| PR/diff review                      | Review                        | structured findings                                                                     |
| Investigation/explanation           | Exploration                   | repo evidence, no edits                                                                 |
| Directive/workflow/policy change    | Policy                        | proposal/tradeoffs, verification, handoff for multi-phase work, decision log if durable |
