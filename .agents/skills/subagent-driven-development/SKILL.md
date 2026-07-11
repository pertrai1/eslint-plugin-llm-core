---
name: "subagent-driven-development"
description: "Load when executing an existing implementation plan with multiple mostly independent tasks using delegated subagents, fresh task context, parent-owned review, and final integration verification."
version: 1.0.0
required: false
category: workflow
tools:
  - claude
  - copilot
  - codex
  - cursor
routing:
  triggers:
    - subagent-orchestration
    - delegated-implementation
    - implementation-plan-execution
    - multi-task-plan
    - parallel-agent-work
  paths:
    - full-path
    - debugging-path
    - policy-path
---

# Subagent-Driven Development

You are an implementation orchestrator. Your job is to execute an existing plan by
splitting safe work into delegated agent tasks while keeping responsibility for
scope, sequencing, review, integration, and final verification.

This skill does not replace planning, TDD, review, or verification. It coordinates
those workflows when fresh subagent contexts are safer than one long-running
implementation session.

## When to Load

Load this skill when all are true:

- an implementation plan, issue task list, PRD-derived task list, or clear staged
  work plan already exists
- the work contains multiple tasks that can be scoped independently or sequenced
  cleanly
- the active client/runtime supports delegated subagents, parallel agents, or
  equivalent isolated worker sessions
- each task can be given self-contained context, constraints, non-goals, and
  verification expectations
- the parent agent can inspect results and run final combined verification

Do not load this skill when:

- requirements are still vague — use `.agents/skills/product-requirements-writer/SKILL.md`
  or `.agents/skills/implementation-task-planner/SKILL.md` first
- one coherent system model is required before any safe edit can happen
- tasks would edit the same files concurrently or compete for the same mutable
  resources
- the active runtime lacks safe delegation support; use the normal Full Path and
  state that subagent orchestration is unavailable
- the orchestration overhead is larger than the risk of simply doing a small edit

## Core Principle: Parent Owns Scope, Subagents Own Slices

A subagent is a worker with isolated context, not a replacement for the parent
agent's judgment. The parent agent must decide what can be delegated, provide the
right context, and verify that the combined result is safe.

Do not dispatch broad prompts such as "implement the plan." Dispatch narrow,
self-contained task slices with explicit constraints and expected evidence.

## Parent-Agent Responsibilities

Before dispatching any subagent:

1. Read the plan or task list once.
2. Extract tasks, dependencies, likely touched files, and verification gates.
3. Classify each task as parallel-safe, sequential, or not delegable.
4. Identify tasks that may share files, shared state, test fixtures, migrations,
   generated outputs, or external resources.
5. Decide the smallest safe delegation units.

During execution:

1. Provide each subagent with the exact task text and relevant local context.
2. Set allowed edit scope, forbidden areas, constraints, and non-goals.
3. Require status, changed files, verification, and concerns in the subagent
   response.
4. Review subagent results before accepting them.
5. Stop unsafe parallel work if changed-file overlap or shared-state coupling
   appears.

Before completion:

1. Inspect the combined diff.
2. Check changed-file overlap and integration risk.
3. Run the selected review skills from `.agents/directives/adaptive-routing.md`.
4. Run relevant project verification and quality gates.
5. Report final evidence from the parent session, not only subagent claims.

## Delegation Decision Rules

Use delegated subagents for tasks that are:

- isolated to different files, modules, packages, tests, or research questions
- small enough to explain in one focused prompt
- independently verifiable
- low-conflict if completed in parallel, or clearly ordered if sequential

Keep work in the parent session or execute sequentially when:

- one task's result determines another task's design
- tasks touch the same files or generated artifacts
- tasks involve migrations, production data, auth/security/privacy, deployment,
  or other high-risk shared state
- broad architecture understanding is required before editing
- the plan itself may be wrong

Parallel delegation is optional. Sequential fresh-context delegation can still be
valuable for long plans when each task needs a clean scope and review checkpoint.

## Subagent Prompt Contract

Every implementation subagent prompt should include:

- **Task goal:** the specific task to complete
- **Original task text:** copied from the plan, not summarized from memory
- **Relevant context:** files, commands, existing patterns, dependencies, prior task
  outcomes that matter
- **Edit scope:** allowed files/areas and forbidden areas
- **Constraints and non-goals:** what not to build, refactor, or clean up
- **Workflow expectations:** TDD, type-first work, debugging, or review rules that
  apply to this task
- **Verification:** exact or best-known checks to run, plus what to report if a
  check is unavailable
- **Output contract:** required status, changed files, verification evidence,
  unresolved risks, and questions

Use this status vocabulary:

| Status               | Meaning                                                                 | Parent action                                     |
| -------------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| `DONE`               | Task complete with evidence and no material concerns                    | Review before accepting                           |
| `DONE_WITH_CONCERNS` | Task complete but the worker found risks, assumptions, or weak evidence | Inspect concerns before review                    |
| `NEEDS_CONTEXT`      | Worker cannot proceed safely without missing information                | Provide context or re-scope                       |
| `BLOCKED`            | Worker cannot complete with current plan/tooling/scope                  | Reassess task size, assumptions, or ask the human |

Never ignore `NEEDS_CONTEXT`, `BLOCKED`, or material concerns. Retrying the same
prompt without changing context usually repeats the failure.

## Review Sequence

For non-trivial delegated implementation, review in this order:

1. **Spec compliance review**
   - Does the change satisfy the original task/spec?
   - Are required paths, APIs, behaviors, and tests present?
   - Did the subagent avoid extra scope?

2. **Quality review**
   - Does the code follow project conventions?
   - Are tests meaningful and behavior-focused?
   - Are error handling, security, data, and operational risks addressed for the
     touched surface?
   - Did the worker introduce unnecessary abstraction, duplication, or broad
     cleanup?

Use existing routed reviewer skills only when their normal routing triggers match
the touched surface or risk:

- `.agents/skills/spec-reviewer/SKILL.md` for spec-governed work
- `.agents/skills/test-reviewer/SKILL.md` for tests and eval scenarios
- `.agents/skills/code-reviewer/SKILL.md` for baseline diff review when a PR, branch,
  local diff, or review checkpoint is in scope
- `.agents/skills/architecture-boundary-reviewer/SKILL.md` for imports, exports, moves,
  package boundaries, or shared utilities
- `.agents/skills/production-readiness-reviewer/SKILL.md` for production-sensitive work

Do not load every reviewer by default. Implementer self-review is useful but never
replaces parent-side or routed reviewer validation when the risk calls for it.

## Failure Handling

If a subagent finds spec gaps:

1. Re-dispatch a focused fix task or fix in the parent session if safer.
2. Re-run the spec review after the fix.
3. Do not move to quality review until material spec gaps are closed.

If a quality reviewer requests changes:

1. Fix only material issues tied to the task.
2. Re-review when the fix changes behavior, tests, or architecture.
3. Track minor follow-ups separately if they are outside scope.

If subagent outputs conflict:

1. Stop accepting further worker changes.
2. Inspect changed-file overlap and assumptions.
3. Resolve conflicts in the parent session or re-scope sequentially.
4. Run combined verification before continuing.

## Common Pitfalls

1. **Dispatching the whole plan.** Broad delegation recreates the same context
   problem in another agent. Slice the plan first.

2. **Parallelizing shared files.** If two workers touch the same file, generated
   output, fixture, migration, or shared resource, treat the work as sequential
   unless you have explicit isolation.

3. **Letting workers infer constraints.** Subagents do not inherit the parent
   session's hidden context. Provide exact task text, constraints, non-goals, and
   verification requirements.

4. **Trusting claims without evidence.** A worker saying tests passed is weaker
   than parent-side verification. Run final combined checks before reporting done.

5. **Turning every small task into a review gauntlet.** Use review depth that
   matches risk. Tiny mechanical tasks may need parent inspection and targeted
   verification; non-trivial behavior changes need spec and quality review.

6. **Skipping integration review.** Independent task success does not prove the
   combined diff is coherent. Always inspect the integrated result.

## Verification Checklist

Before completing a subagent-driven implementation:

- [ ] The parent agent read and classified the full plan before dispatching work.
- [ ] Each subagent received self-contained context, constraints, non-goals, edit
      scope, and verification expectations.
- [ ] Parallel work did not edit the same files or shared mutable resources.
- [ ] `NEEDS_CONTEXT`, `BLOCKED`, and `DONE_WITH_CONCERNS` statuses were handled
      explicitly.
- [ ] Spec compliance was checked before quality review for non-trivial tasks.
- [ ] Relevant routed reviewer skills were used only when their normal triggers
      matched the touched surfaces or risks.
- [ ] The parent agent inspected the combined diff and ran final verification.
