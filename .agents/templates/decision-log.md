---
date: <!-- FILL IN: YYYY-MM-DD — today's date -->
task: <!-- FILL IN: one-line task description -->
domain: <!-- FILL IN: short-kebab-case-decision-domain -->
kind: <!-- FILL IN: repo-policy | process | architecture | code-convention -->
scope: <!-- FILL IN: repo | cross-cutting | subtree -->
status: active
triggers:
  - <!-- FILL IN: when this record should be read -->
applies_to:
  - <!-- FILL IN: path/or/glob affected by this decision -->
supersedes: []
---

# <!-- FILL IN: verb phrase naming the decision domain, e.g. "Adopt structured error handling pattern" -->

## Context

<!-- FILL IN: 2–4 sentences describing the problem, constraints, and why this was a real choice with plausible alternatives. -->

## Decision

<!-- FILL IN: one paragraph with specific reasoning — name the properties that made this option preferable. -->

## Rejected Alternatives

<!-- FILL IN: at least one entry. Name the alternative and the specific reason it was disqualified. -->

<!-- Example:
**Option X** — [describe briefly]. Rejected because [specific reason it didn't meet requirements].
-->

## Consequences

<!-- FILL IN: what this decision makes true going forward. Include: -->

**Easier:**

- <!-- FILL IN: what becomes simpler as a result of this decision -->

**Harder:**

- <!-- FILL IN: what becomes more difficult as a result of this decision -->

**Watch for:**

- <!-- FILL IN: risks or edge cases to monitor over time -->
