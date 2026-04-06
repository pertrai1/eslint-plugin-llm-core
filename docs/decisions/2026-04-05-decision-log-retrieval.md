---
date: 2026-04-05
task: Tighten the decision-log rule and make logs easier for agents to retrieve progressively
domain: decision-log-retrieval
kind: process
scope: repo
status: active
triggers:
  - editing decision-log instructions
  - changing how agents should read prior decisions
  - updating decision-log metadata requirements
applies_to:
  - AGENTS.md
  - .agents/directives/SESSION_DECISIONS.md
  - docs/decisions/**
  - .github/PULL_REQUEST_TEMPLATE.md
supersedes: []
---

# Use metadata-first retrieval for decision logs

## Context

The repo already had decision logs, but the instructions focused on when to
write them and were not explicit about when agents should read existing ones.
That left two plausible approaches: rely on filenames and full-text scanning, or
add lightweight metadata and an explicit retrieval workflow for progressive
disclosure. The rule for when to create a log was also too broad, which risked
turning the directory into a record of ordinary implementation choices.

## Decision

Require a small YAML frontmatter block on every decision log and instruct agents
to scan that metadata before opening any full record. Keep
`SESSION_DECISIONS.md` as the canonical source for the retrieval workflow and
frontmatter schema, with directory-level docs linking back to it instead of
restating the full rules. The metadata-first workflow keeps retrieval cheap,
makes active logs discoverable by domain, trigger, and affected paths, and
avoids loading unrelated history. At the same time, tighten the logging
threshold so records are only required for durable repo/process,
architectural, or cross-cutting convention decisions whose reasoning would
otherwise be easy to lose.

## Rejected Alternatives

### Keep prose-only logs and rely on filenames plus full-text search

This was rejected because filenames alone are too coarse for progressive
disclosure and full-text scanning forces an agent to load more context than it
needs before it can decide relevance.

### Add a larger taxonomy with many metadata fields

This was rejected because a wide schema would create maintenance overhead and
metadata drift without materially improving the basic retrieval decision. A
small operational schema is enough for this repo's size.

## Consequences

**Easier:** Finding the right decision logs before changing repo policy or
cross-cutting conventions.

**Harder:** Keeping frontmatter accurate when logs are created, superseded, or
retired.

**Watch for:** New metadata fields that do not directly help retrieval; they
should be resisted unless the lookup workflow actually needs them.
