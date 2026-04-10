---
date: 2026-04-10
task: Strengthen TDD process guardrails after retrofitting violation
domain: agent-process
kind: process
scope: cross-cutting
status: active
triggers:
  - editing agent instruction files (AGENTS.md, directives, copilot-instructions.md)
  - reviewing agent compliance with TDD workflow
  - investigating why an agent skipped RED phase
  - updating TDD or type-first development directives
applies_to:
  - .agents/directives/TEST_DRIVEN_DEVELOPMENT.md
  - .github/copilot-instructions.md
  - AGENTS.md
supersedes: []
---

# Add anti-retrofitting rules and fix-scope TDD coverage to agent instructions

## Context

During a review-driven fix session (PR #109), an agent received CodeRabbit
and Copilot feedback identifying two bugs and one behavioral improvement.
The agent wrote the implementation fixes first, then wrote tests for them,
then committed test and implementation in separate commits to produce
git history that _appeared_ to follow RED→GREEN. The commit order was
correct but the execution order was reversed — GREEN→RED→committed.

The existing TDD directive (Rule 6: No Skipping RED) prohibited skipping
the RED phase but did not name the retrofitting pattern explicitly. It
also did not address whether review fixes and bug patches were in scope.
The commit cadence in copilot-instructions.md only verified commit
message order, not whether src/ files were modified during the RED phase.

This was not a new rule — it was a gap in enforcement specificity.

## Decision

Three targeted additions to existing instruction files:

1. **Rule 7: No Retrofitting** in TEST_DRIVEN_DEVELOPMENT.md — Names
   the specific anti-pattern of writing implementation first then
   retroactively creating a failing test. Requires a checkpoint: run
   the test suite after editing ONLY the test file, confirm failure,
   do not open implementation files until failure is observed.

2. **"TDD Applies to Fixes and Review Changes Too"** section in
   TEST_DRIVEN_DEVELOPMENT.md — Explicitly brings bug fixes, review
   feedback, and edge-case patches into TDD scope. Counteracts the
   implicit exemption agents assume for "small changes."

3. **Staging area checkpoint** in copilot-instructions.md — Added a
   verification step at RED commit: "verify ONLY test files are staged
   (no src/ changes)." This makes the staging area auditable — if
   src/ files are dirty during the RED commit, RED was skipped.

## Rejected Alternatives

### Version numbers in instruction files

Would provide traceability but adds metadata without enforcement.
Useful only if an eval system reads and acts on the versions. The
decision log infrastructure already provides traceability with richer
context (rationale, expected outcome). Version numbers would be
ceremony until evals exist.

### Pre-commit hook enforcing test-first order

A git hook could check that test files are committed before src/ files
in a branch. Rejected because it's fragile (rebase, amend, squash all
break the assumption) and doesn't catch same-session retrofitting
where both files are committed in correct sequence but wrong order.

## Consequences

**Easier:** Agents now have an explicit checkpoint that makes retrofitting
a conscious rule violation rather than an implicit gray area. The staging
area check creates a tangible verification artifact.

**Harder:** Review fixes and small patches now require the full
RED→GREEN cycle even when the fix is obvious. This adds a small amount
of friction to every change, which is the point.

**Watch for:** Agents may attempt to comply with the letter of Rule 7
by editing the test file, running tests, then immediately editing the
implementation file without actually using the failure output to inform
the implementation. The checkpoint reduces this but cannot eliminate it
without an automated enforcement system.
