---
date: YYYY-MM-DD
task: one-line task description
domain: short-kebab-case-decision-domain
kind: [repo-policy | process | architecture | code-convention]
scope: [repo | cross-cutting | subtree]
status: active
triggers:
  - when this record should be read
applies_to:
  - path/or/glob
supersedes: []
---

# [Title: one sentence starting with a verb — "Use X for Y" or "Reject X in favor of Y"]

## Context

[2–4 sentences. What problem were you solving? What constraints applied?
What made this a real choice rather than an obvious one?]

## Decision

[One paragraph. What did you choose and why? Be specific — name the properties of
the chosen option that made it preferable, not just "it was better".]

## Rejected Alternatives

### [Alternative 1 name]

[Why rejected. Be specific: name the property of this option that disqualified it.]

### [Alternative 2 name]

[Why rejected.]

## Consequences

**Easier:** [What this decision makes straightforward.]

**Harder:** [What this decision makes more difficult or introduces as a new constraint.]

**Watch for:** [Any follow-on decisions this forces, or failure modes to monitor.]
