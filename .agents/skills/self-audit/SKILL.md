---
name: "self-audit"
description: "Triage your own weakest assumptions and anomalies after GREEN/REFACTOR, before verification. Use after TDD cycle completes or before opening a PR."
version: 1.0.0
routing:
  triggers:
    - after-refactor
    - before-verification
    - full-path
    - pre-pr
  paths:
    - full-path
---

# Self-Audit

After GREEN/REFACTOR, before verification. This is a triage point — some
findings loop back to TDD, others flow forward into the PR body.

```
TDD (RED → GREEN → REFACTOR)
        │
        ▼
    SELF-AUDIT (triage)
        │
        ├─ 🔁 Fix now ──▶ RED (one targeted TDD cycle)
        │                       │
        │                       ▼
        │                 SELF-AUDIT pass 2 (document only)
        │                       │
        ├─ 📋 Document ────────┤
        │                       │
        ├─ 🧑 Ask human ───────┤
        │                       ▼
        └──────────────▶ Verification → PR
```

**One-loop-max:** Pass 1 triages. If it sends a fix to RED, pass 2 is
documentation only. There is no pass 3.

---

## The Jenga Test (always required)

Name the **single weakest assumption** in your implementation — the block
that, if pulled, collapses the most.

For each entry, state:

- **Weakest assumption** — specific and falsifiable, not vague
- **It would break if** — the concrete condition that makes it false
- **Evidence supporting it** — what you verified, or "none"
- **Routing** — 🔁 Fix now / 📋 Document / 🧑 Ask human

If you can't identify a weak assumption, that _is_ the Jenga entry:
"My assumption is that I have no weak assumptions."

### Routing criteria

- **🔁 Fix now** — One TDD cycle. In scope. Shipping without it is irresponsible.
- **📋 Document** — Architectural, out of scope, or multi-cycle. Known gap, not a blocker.
- **🧑 Ask human** — Can't assess fixability, or the fix changes the approach.

---

## Anomaly Register (required when anomalies exist)

Log every warning, deprecation notice, flaky test, or unexpected side effect
observed during the TDD cycle. For each, record what it was, whether it's new
or recurring, what it might signal, and a routing decision.

**"It's always been like that" is not a valid disposition.** Recurring anomalies
get the highest suspicion, not the lowest.

A suspiciously empty register is itself a signal.

---

## Diff and Boundary Reality Check (required when code changed)

Before finalizing self-audit, inspect the actual diff. If `difit` is available,
prefer it for a local GitHub-style review:

```bash
npx difit .
npx difit staged
```

Use the diff to look for:

- unrelated edits that expanded beyond the task
- imports or exports that cross an architectural boundary
- missing tests adjacent to changed behavior
- public API changes not reflected in docs or verification
- risky deletions, broad rewrites, or new shared utilities

If Fallow is available in a TypeScript/JavaScript project, use relevant summary
checks as self-audit evidence for architecture drift, dead code, duplication, and
cycles. Route any boundary uncertainty into the Jenga Test.

---

## Sunk Cost Check (required after 3+ TDD cycles in a session)

Assess trajectory across cycles. If two or more of these are true, surface it:

1. Jenga entries are getting more severe each cycle
2. Anomaly Register is growing rather than stabilizing
3. Later cycles work around limitations of earlier cycles

The question to surface: _"If I started fresh with what I know now, would I
choose this same approach?"_ The human decides. You surface.

---

## Output Routing

Each destination fires on a specific condition:

| When                                                                                              | Route to                                                      | What                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Always**, when opening a PR and self-audit produced routed findings                             | `## Self-Audit` in the PR body, **before** `## Verification`  | Full Jenga + Anomaly Register + Sunk Cost (if triggered). Reviewer sees uncertainty before proof.                                                       |
| **When** self-audit has no routed findings                                                        | One-line PR note                                              | `Self-audit completed; no routed findings.` Avoid boilerplate sections with no information.                                                             |
| **Always**, when running verification after self-audit                                            | Verification focus areas (same session)                       | Verification's functional proof must target any 📋 documented Jenga assumption.                                                                         |
| **When** an anomaly matches one you've seen in a previous PR's self-audit                         | `docs/ERRORS.md` (error-memory format)                        | Recurrence across PRs promotes an anomaly from one-time observation to systemic pattern. Check by grepping recent merged PRs for the same warning text. |
| **When** the human decides to change approach after a Sunk Cost Signal                            | `docs/decisions/` (session-decisions format)                  | Captures why the approach changed. If the human says "continue," no log needed — the signal is already in the PR body.                                  |
| **When** starting work in a module that has been self-audited before (during codebase navigation) | Read previous `## Self-Audit` sections from recent merged PRs | Previous Jenga entries are the known weak spots. If your change makes a previous break condition more likely, include it in your own self-audit.        |
