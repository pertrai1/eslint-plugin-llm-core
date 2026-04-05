# Decision Logs

This directory contains records of non-obvious architectural and design decisions
made during development of this project.

## What belongs here

A decision log captures a choice between real alternatives when the reason for
the choice is not visible in the code itself. It is not a changelog, a commit
message, or a code comment — it is the reasoning that would otherwise exist only
in someone's memory.

## What does not belong here

- Choices mandated by project directives (TDD, type-first development)
- Routine implementation decisions visible from the code
- Bug fixes

## How to read these

Each log names the decision domain (not the outcome), the context that made the
decision necessary, the alternatives considered, and the consequences accepted.
Start with the date and topic in the filename to find decisions relevant to your
current work.

## How to write one

See [TEMPLATE.md](./TEMPLATE.md). Agents must also follow
[`.agents/directives/SESSION_DECISIONS.md`](../../.agents/directives/SESSION_DECISIONS.md).
