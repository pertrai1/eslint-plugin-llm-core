---
name: task-framing
description: Frames non-trivial, ambiguous, high-risk, or cross-cutting tasks before substantial edits.
version: 1.0.0
triggers:
  - non-trivial-task
  - ambiguous-task
  - high-risk-task
  - cross-cutting-change
routing:
  load: conditional
---

# Task Framing Directive

## Prerequisite: Before Major Edits on Non-Trivial Work

This directive governs how the agent frames a task before substantial edits.
It applies when the task is non-trivial, ambiguous, high-risk, or cross-cutting.
'Non-trivial' typically means anything beyond a single-file typo fix or a
docs-only wording change.

Load this directive when selected by `.agents/directives/ADAPTIVE_ROUTING.md` before a
non-trivial, ambiguous, high-risk, or cross-cutting task — including new
features, cross-cutting refactors, and anything affecting repo-wide conventions.

Do not optimize for agreement. Optimize for accuracy, uncertainty clarity, and
identifying weak assumptions.

**Anti-Righting-Reflex:** When the user presents a specific approach, do not
correct or counter it before understanding it. Ask _"What led you to this
approach?"_ first. Their reasoning may contain constraints you don't have.
Only after understanding the why, surface concerns — framed as questions,
not corrections.

---

## The Minimum Framing Checklist

Before major edits, establish:

1. **Problem** — what exactly is changing?
2. **Success criteria** — what observable result makes the task done?
3. **Constraints** — stack, runtime, repo conventions, compatibility limits,
   boundaries, and files or behavior that must not change
4. **Definitions** — resolve ambiguous words like "simple," "optimized,"
   "clean," or "production-ready" into concrete criteria when they affect the
   implementation
5. **Assumptions** — name any environment or codebase assumptions that
   materially affect the approach
6. **Failure modes** — identify the main edge cases, regressions, or break
   points before substantial edits
7. **Alternatives** — when multiple plausible approaches exist, state the one
   chosen and why the others were rejected. **If the choice looks binary
   (A or B), find at least one third option before deciding.** Binary framing
   usually means the decision space hasn't been fully explored. The third
   option doesn't need to win — it needs to be real enough to consider.
8. **Evidence plan** — which repo artifacts or official docs will validate the
   approach? Prefer repo evidence first: directives, active decision logs,
   types, tests, and existing patterns; use official external docs when runtime
   or library behavior depends on them

If any of these materially affect the implementation and remain unknown, ask a
concise clarifying question before major edits.

## When a Proposal Should Precede Implementation

Provide a short proposed approach before major edits when:

- The task changes repo policy or contributor workflow
- The task is cross-cutting
- The request contains ambiguous success criteria
- Multiple plausible implementations exist with different tradeoffs
- External behavior must be verified before coding

The proposal should name:

- chosen approach
- main assumptions
- key alternatives rejected
- primary regression or edge-case risks

When reasoning or research is part of the task, separate:

- repo evidence
- external facts
- your own inference

If a conclusion is uncertain, say so directly instead of smoothing it into a
confident answer.

## Evidence Order

Prefer evidence in this order:

1. Project-level instructions (e.g., AGENTS.md, CLAUDE.md, or equivalent)
2. Applicable directive files
3. Scoped instructions for the area you're working in
4. Active decision logs in `docs/decisions/`
5. Types, tests, and existing code patterns in the touched area
6. Official external docs when behavior depends on a library, runtime, or spec

This order prevents generic advice from overriding repo-specific conventions.
