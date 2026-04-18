# Prompting AI Coding Agents

This guide is for humans working with coding agents in this repo.

The goal is not to write longer prompts. The goal is to give the agent the
constraints that change the implementation. Better prompts reduce rework,
surface assumptions earlier, and make reviews faster.

Use this guide for non-trivial work: new rules, behavior changes, refactors,
cross-cutting docs/process updates, or anything where "clean," "optimized," or
"better" could mean several different things.

For repo-mandated agent workflow, see [AGENTS.md](../../AGENTS.md). For the
agent's repo-specific intake checklist, see
[agent-task-framing.md](./agent-task-framing.md).

## What to Specify Up Front

Before the agent writes code, try to define:

1. **The specific problem**: what is broken, missing, or needs to change?
2. **Success criteria**: what does a correct outcome look like?
3. **Constraints**: language/runtime/version, allowed libraries, performance
   limits, compatibility requirements, repo conventions.
4. **Definitions for ambiguous words**: what do you mean by "simple,"
   "optimized," "maintainable," or "production-ready" in this task?
5. **Known boundaries**: what should not change?
6. **Known edge cases**: which corner cases, regressions, or failure paths
   matter most for this task?

Good prompt details:

- "By optimized, I mean under 100ms on the current fixture set."
- "Do not change public rule names or recommended config membership."
- "Keep the existing lint-message structure: what / why / how-to-fix."

Weak prompt details:

- "Make it cleaner."
- "Improve performance."
- "Refactor if needed."

## Prompt Template

Use this when the task is large enough that the approach matters.

```md
I need [specific problem].

Success looks like:

- [concrete outcome]
- [observable proof or behavior]

Constraints:

- Runtime/language/version: [example]
- Libraries/tools allowed: [example]
- Repo conventions that matter: [example]
- Do not change: [example]

Known edge cases:

- [example]
- [example]

By [ambiguous term], I mean [concrete definition].

Before making major edits, tell me:

1. The approach you plan to take
2. The assumptions that affect the approach
3. Plausible alternatives you considered and rejected
4. The main failure modes, edge cases, or regression risks
5. What evidence you will use: repo tests, directives, decision logs, or official docs
```

## Review Questions

If the agent's proposal or implementation feels thin, ask:

1. Why this approach over the alternatives?
2. What assumptions are you making about the environment or existing code?
3. Where does this break or become risky?
4. What edge cases or error paths did you leave out?
5. What evidence supports this: repo tests, directives, code patterns, or
   official documentation?

These questions matter more than "is this best practice?" because they force the
agent to name tradeoffs and support claims.

## Repo-Specific Advice

In this repo, high-signal prompts usually mention:

- Whether the change is docs-only or behavior-changing
- Which rule, config, or directive is in scope
- Whether a decision log is expected
- Whether rule docs or README generation should remain untouched
- Whether the task is local or cross-cutting

Example:

```md
Update the contributor workflow docs so contributors know how to frame non-trivial
AI-agent tasks. This is docs-only. Do not change rule behavior, rule docs, or the
generated README sections. If you introduce a durable workflow convention, include
the matching decision log.
```

## When to Ask for a Proposal First

Ask the agent to pause and explain the approach before editing when:

- The request is ambiguous
- The change is cross-cutting
- The work could affect repo policy or contributor workflow
- Multiple plausible implementations exist
- External library or platform behavior is part of the decision

For small obvious fixes, this usually adds friction without improving quality.

## What This Guide Does Not Replace

This guide improves task framing. It does not replace:

- [AGENTS.md](../../AGENTS.md)
- Mandatory directives in `.agents/directives/`
- Scoped instructions in `.github/instructions/`
- Existing tests, types, and decision logs
