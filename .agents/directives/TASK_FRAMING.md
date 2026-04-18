# Task Framing Directive

## Prerequisite: Before Major Edits on Non-Trivial Work

This directive governs how the agent frames a task before substantial edits.
It applies when the task is non-trivial, ambiguous, high-risk, or cross-cutting.
In this repo, "non-trivial" usually means anything beyond a single-file typo
fix or a docs-only wording change.

▎ This directive runs before implementation when the task needs more than a
simple local fix. See AGENTS.md.

Do not treat ordinary docs as binding instruction sources unless AGENTS.md,
another directive, or the user explicitly points to them.

Do not optimize for agreement. Optimize for accuracy, uncertainty clarity, and
identifying weak assumptions.

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
   chosen and why the others were rejected
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

1. `AGENTS.md`
2. Applicable files in `.agents/directives/`
3. Matching scoped instructions in `.github/instructions/`
4. Active decision logs in `docs/decisions/`
5. Types, tests, and existing code patterns in the touched area
6. Official external docs when behavior depends on a library, runtime, or spec

This order prevents generic advice from overriding repo-specific conventions.

## Repo-Specific Triggers

Load this directive explicitly when work touches:

- `AGENTS.md`
- `.agents/directives/**`
- `.github/instructions/**`
- `docs/decisions/**`
- `src/index.ts`
- published-output fields in `package.json`
- contributor workflow or repo policy
- rule message format or rule authoring conventions

These areas create durable conventions. Small wording changes can have repo-wide
effects.

## Supplemental References

- Human-facing prompt guide: [`../../docs/guides/prompting-ai-coding-agents.md`](../../docs/guides/prompting-ai-coding-agents.md)
- Repo framing reference: [`../../docs/guides/agent-task-framing.md`](../../docs/guides/agent-task-framing.md)

The docs above are supporting material. This directive is the binding workflow
rule.
