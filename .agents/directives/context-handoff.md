---
name: context-handoff
description: Compresses task state at directive or session boundaries so later phases can continue from a compact, current-state handoff instead of drifting through accumulated chat history.
version: 1.0.0
triggers:
  - directive-boundary
  - session-handoff
  - context-compaction
  - long-running-task
  - multi-phase-workflow
routing:
  load: conditional
  applies_to:
    - implementation
    - debugging
    - review
    - exploration
    - policy-change
---

# Context Handoff Directive

## Purpose

Use this directive to compact the current task state before switching major
workflow phases, handing work to another agent/session, pausing a long task, or
starting a new directive that should not inherit stale context.

A handoff capsule is a current-state summary, not a transcript. It preserves the
facts, decisions, evidence, and open risks that still matter while explicitly
retiring obsolete plans and rejected paths.

## Important Limitation

Markdown instructions cannot erase a model's active context. This directive is a
discipline mechanism for reducing context drift.

When a true fresh session is available, start the next session with only:

1. the user's current request,
2. the latest handoff capsule,
3. project instructions required by the router, and
4. repository evidence discovered by the new session.

When a true fresh session is not available, treat the latest handoff capsule as
the authoritative summary and ignore unstated prior assumptions.

---

## When to Use

Create or update a handoff capsule when any of these apply:

- The router switches between major phases or directives on Full, Debugging,
  Boundary, Review, Exploration, or Policy paths.
- The task spans enough steps that accumulated chat context may become noisy.
- Work is paused and may resume later.
- Another agent/session will continue the work.
- A review, PR, or human handoff needs a compact summary of current state.
- The agent changed direction and needs to retire stale assumptions or rejected
  approaches.

For Light Path work, a handoff is optional unless the user asks for one or the
work will continue in another session.

---

## Storage

Use the first available storage location:

1. `.agents/handoff.md` — preferred when local file access is available.
2. The final assistant response — when file access is unavailable.
3. A PR comment — when handing off review context to humans or review agents.

Do not commit `.agents/handoff.md` or `.agents/handoff-log.md` unless the user
explicitly requests committed agent-state artifacts. These files are session
state, not project source.

If project conventions already define another agent state directory, use that
instead and state the chosen path in the handoff.

---

## Update Semantics

`.agents/handoff.md` is the active, authoritative handoff document. Rewrite it at
handoff boundaries so it always represents the latest compact current state.

Do not append indefinitely to the active handoff. Endless append-only handoffs
recreate context drift by preserving stale assumptions, obsolete plans, and
superseded evidence.

If an audit trail is needed, append historical entries to
`.agents/handoff-log.md`, but treat that log as historical only. The active
handoff supersedes the log, prior plans, stale tool output, and abandoned
approaches.

---

## Handoff Capsule Template

```md
# Agent Handoff

Last updated: <date/time if available>
Storage: <path, response, or PR comment>
Current workflow route: <Light | Full | Debugging | Boundary | Review | Exploration | Policy | combined>
Current directive/phase: <directive or phase completing now>
Next recommended directive/phase: <directive or phase to load next>

## User Intent

<The user's current request in 1-3 sentences.>

## Current Task State

<What is true now. Include branch/PR, changed files, relevant commands, and the
current implementation/review status.>

## Decisions That Still Matter

- <Decision and why it remains relevant.>

## Evidence Collected

- <Command/tool/check>: <result and why it matters>

## Files and Surfaces Involved

- `<path>` — <changed/read/relevant and why>

## Open Risks / Unknowns

- <Risk, missing evidence, or uncertainty that the next phase must handle>

## Rejected or Superseded Context

- <Old approach, stale failure output, or assumption the next phase should ignore>

## Next Directive Input

The next directive should:

1. <specific next action>
2. <specific verification or question>

The next directive should not rely on:

- <unstated prior chat, obsolete plan, or old tool output>
```

Use concise bullets. Keep the capsule short enough to paste into a new session.
Prefer current facts over narrative history.

---

## Phase Boundary Rules

Before switching from one major directive/phase to another:

1. Identify whether a handoff is required by the route.
2. Rewrite the active handoff with only current relevant state.
3. Mark stale plans, old failures, and rejected approaches as superseded.
4. Name the next directive/phase and the exact inputs it needs.
5. If file storage is unavailable, print the capsule in the response.

The next directive must start from:

1. the latest handoff capsule,
2. the user's current request, and
3. repository evidence it independently inspects when needed.

The next directive must not rely on hidden chat context that is absent from the
handoff.

---

## PR and Review Handoffs

For PR workflows, the final handoff may be placed in the PR body or a PR comment
when it helps reviewers. Keep it focused on:

- workflow route used,
- files/surfaces changed,
- verification evidence,
- known risks or skipped checks,
- review focus for humans or bots.

Do not post per-directive handoffs as repeated PR comments. Use a single compact
review handoff unless the user requests a detailed audit trail.

---

## Forbidden Patterns

| Pattern                                                  | Why Forbidden                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| Appending forever to the active handoff                  | Recreates context drift and makes stale state look relevant         |
| Treating the handoff as proof without evidence           | The capsule summarizes evidence; it does not replace running checks |
| Carrying forward assumptions not written in the capsule  | Defeats the purpose of compaction                                   |
| Committing session-state handoff files by default        | Pollutes project history with local agent state                     |
| Using handoff ceremony for tiny one-step Light Path work | Adds boilerplate without reducing risk                              |
| Hiding unresolved risks to make the handoff look clean   | The next phase needs accurate open questions                        |

---

## Quick Reference

| Situation                        | Handoff required?                                          | Storage                               |
| -------------------------------- | ---------------------------------------------------------- | ------------------------------------- |
| Tiny docs/typo Light Path        | Usually no                                                 | Response summary if useful            |
| Full Path behavior change        | Yes at major phase boundaries                              | `.agents/handoff.md` when available   |
| Debugging/failing CI             | Yes after reproduction, before fix, and after verification | `.agents/handoff.md`                  |
| Boundary-sensitive refactor      | Yes before boundary review and final verification          | `.agents/handoff.md`                  |
| PR handoff to humans/review bots | Yes when useful                                            | PR body/comment                       |
| True new session                 | Yes                                                        | Paste latest capsule into new session |
