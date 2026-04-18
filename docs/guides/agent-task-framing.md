# Agent Task Framing Reference

This document is a supplemental repo reference for coding agents. It is not a
replacement for [AGENTS.md](../../AGENTS.md) or the mandatory directives.

Read this when the task is non-trivial, ambiguous, cross-cutting, or likely to
touch repo policy, contributor workflow, generated docs, or rule authoring
conventions.

## Purpose

The point of task framing is to reduce false confidence before implementation.
An agent should not jump from "I found the files" to "I know the right change"
without first naming the constraints and the risks that materially shape the
solution.

## Use This Checklist

Before substantial edits, confirm. This reference expands the directive's
minimum checklist by splitting constraints into in-scope and out-of-scope
surface area:

1. **Problem**: what is being asked to change?
2. **Success criteria**: what concrete result will count as correct?
3. **In-scope surface**: which files, modules, rules, docs, or workflows are
   actually part of the task?
4. **Out-of-scope boundaries**: what must remain unchanged?
5. **Definitions**: which ambiguous terms need concrete meaning?
6. **Assumptions**: what is being assumed about the environment, version, or
   codebase state?
7. **Alternatives**: which plausible approaches exist, and why is one being
   preferred?
8. **Failure modes**: what could break, regress, or create misleading docs?
9. **Evidence plan**: which repo artifacts or official docs will validate the
   approach?

If any of these materially affect the implementation and remain unknown, pause
and clarify before major edits.

## Evidence Order

Prefer evidence in this order:

1. `AGENTS.md`
2. Applicable files in `.agents/directives/`
3. Matching scoped instructions in `.github/instructions/`
4. Active decision logs in `docs/decisions/`
5. Types, tests, and existing code patterns in the touched area
6. Official external docs when behavior depends on a library, runtime, or spec

This order keeps repo-local conventions from being overwritten by generic advice.

## When a Proposal Should Precede Implementation

Provide a short proposed approach before major edits when:

- The task changes repo policy or contributor workflow
- The task is cross-cutting
- The request contains ambiguous success criteria
- There are multiple plausible implementations with different tradeoffs
- External behavior must be verified before coding

The proposal does not need to be long. It should name:

- chosen approach
- main assumptions
- key alternatives rejected
- primary regression or edge-case risks

## Repo-Specific Triggers

Slow down and frame the task explicitly when work touches:

- `AGENTS.md`
- `.agents/directives/**`
- `.github/instructions/**`
- `docs/decisions/**`
- `src/index.ts`
- published-output fields in `package.json`
- contributor workflow or repo policy
- rule message format or rule authoring conventions

These areas create durable conventions. A small wording change can have
repo-wide effects.

## Example: Weak vs Strong Framing

Weak:

```md
Improve the agent docs.
```

Strong:

```md
Add repo guidance for non-trivial AI-agent tasks. Keep it docs-only. Do not
change rule behavior, generated rule docs, or generated README sections. Make
one guide for contributors, one reference doc the agent can consult, and a
short mandatory intake rule in AGENTS.md. If this sets a durable workflow
convention, add the decision log.
```

## Failure Modes to Watch For

- Treating a human-facing guide in `docs/` as if it were automatically binding
  on the agent
- Adding broad "best practice" language that conflicts with existing repo
  directives
- Using external advice that overrides repo-specific conventions without an
  explicit decision
- Writing guidance that tells the agent to wait for approval by default when
  the actual workflow is to proceed unless planning is requested
- Updating process guidance without adding the matching decision log
