---
date: 2026-04-18
task: Add human-facing prompting guidance and agent-facing framing rules for non-trivial tasks
domain: agent-guidance-layering
kind: process
scope: repo
status: active
triggers:
  - editing AGENTS.md task-intake guidance
  - editing task framing directive behavior
  - adding or changing AI agent prompting docs
  - changing contributor workflow for AI-assisted work
applies_to:
  - AGENTS.md
  - .agents/directives/TASK_FRAMING.md
  - CONTRIBUTING.md
  - docs/guides/prompting-ai-coding-agents.md
  - docs/guides/agent-task-framing.md
supersedes: []
---

# Use layered guidance for AI coding agent task framing

## Context

The repo already had strong implementation directives, but it did not clearly
separate three different needs: how humans should frame requests to the agent,
what the agent must treat as mandatory intake behavior, and which supplemental
repo docs the agent may consult when a task is ambiguous or cross-cutting. That
left two plausible but incomplete options: put all of the guidance into
`AGENTS.md`, or leave it as ordinary docs and hope the agent finds it when
needed.

## Decision

Use a layered structure. Keep `AGENTS.md` short and binding by pointing to a
dedicated task-framing directive; add a contributor-facing prompt and review
guide for humans; and add a supplemental repo framing reference the agent can
consult for ambiguous or cross-cutting work. This keeps the hard rules
discoverable and auditable, preserves a human-friendly guide that can use
examples and templates, and provides a deeper repo-specific reference without
turning `AGENTS.md` into a catch-all wiki. The directive should also bias the
agent away from agreement-seeking behavior by explicitly preferring accuracy,
uncertainty clarity, and weak-assumption detection during research and response.

## Rejected Alternatives

### Put all prompting and framing guidance directly into AGENTS.md

This was rejected because `AGENTS.md` already carries workflow-critical
instructions. Expanding it into a full prompt guide would make the mandatory
rules harder to scan and encourage policy drift inside a file that should stay
compact and enforceable.

### Keep the new guidance only in docs/guides and do not wire it into AGENTS.md

This was rejected because ordinary docs are reference material, not reliable
instruction sources. Without a binding section in `AGENTS.md`, agents might miss
the framing expectations entirely or treat them as optional background reading.

## Consequences

**Easier:** Giving contributors a concrete way to frame non-trivial AI-agent
tasks while keeping the agent's mandatory intake behavior explicit and less
vulnerable to agreement-seeking answers.

**Harder:** Keeping the three layers aligned when one of them changes. Updates to
agent framing guidance now require checking both the docs and the binding rule
in `AGENTS.md`.

**Watch for:** Guidance that drifts into conflict between the human-facing docs
and the mandatory repo instructions. If the repo workflow changes, update the
binding section first and then sync the supporting docs.
