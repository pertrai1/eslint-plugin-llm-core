---
date: 2026-04-05
task: Define a concrete rewrite template for lint messages and tighten inaccurate guidance
domain: lint-messages
kind: code-convention
scope: cross-cutting
status: active
triggers:
  - editing rule messages
  - changing lint guidance format
  - updating the lint-message guide
applies_to:
  - docs/guides/lint-message-template.md
  - src/rules/**
  - tests/rules/message-guidance.test.ts
supersedes: []
---

# Use before/after rewrites for agent-facing lint messages

## Context

Several rules used the repo's what/why/how structure, but the actual message text varied widely in quality. Some messages taught inaccurate facts, some spent too many tokens on rationale, and some offered broad refactor advice instead of a local repair. This was a real choice because the plugin needs to balance human-readable guidance with messages that an LLM can apply with minimal inference.

## Decision

Use a lint-message template with three parts: one direct violation sentence, one short `Why:` line, and a concrete `How to fix:` section anchored in `Before:` and `After:` rewrites. This format keeps the message self-contained while biasing the agent toward the smallest local change that satisfies the rule. For rules with multiple plausible intents, the template allows a tightly bounded set of explicit outcomes instead of open-ended prose.

## Rejected Alternatives

### Keep the existing verbose prose format

This was rejected because the longer rationales consumed tokens without improving the likely repair, and several messages drifted into generic advice instead of concrete remediation.

### Remove rationale entirely and only show a fix

This was rejected because some rules need a short consequence statement to disambiguate intent and prevent shallow mechanical rewrites. Dropping `Why:` completely would make the messages less teachable and less consistent across the plugin.

## Consequences

**Easier:** Writing messages that stay concise, concrete, and consistent across rules.

**Harder:** Preserving rich explanatory context inside the lint error itself; deeper teaching has to move into docs.

**Watch for:** Examples that accidentally teach the wrong contract or bundle unrelated fixes into one rewrite.
