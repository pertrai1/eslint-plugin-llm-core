# Decision Logs

This directory contains records of durable repo/process, architectural, and
cross-cutting design decisions made during development of this project.

## What belongs here

A decision log captures a durable choice between real alternatives when the
reason for the choice is not obvious from the diff alone. It is not a changelog,
a commit message, or a code comment. It exists to preserve reasoning that would
otherwise live only in an agent's or contributor's memory.

## What does not belong here

- Choices mandated by project directives (TDD, type-first development)
- Routine implementation decisions visible from the code
- Local one-off code decisions that do not create an ongoing convention
- Bug fixes

## How to find relevant logs

The canonical retrieval workflow and frontmatter schema live in
[`.agents/directives/SESSION_DECISIONS.md`](../../.agents/directives/SESSION_DECISIONS.md).
Use that directive as the source of truth so the lookup rules do not drift.

In short: scan frontmatter first, keep only active entries, then open only the
records whose `domain`, `triggers`, or `applies_to` match the task.

## How to read these

Each log names the decision domain, the context that made the decision
necessary, the alternatives considered, and the consequences accepted. Start
with the frontmatter to find relevant records, then read the body for reasoning.

## How to write one

See [TEMPLATE.md](./TEMPLATE.md). Agents must also follow
[`.agents/directives/SESSION_DECISIONS.md`](../../.agents/directives/SESSION_DECISIONS.md).
