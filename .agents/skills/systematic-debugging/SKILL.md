---
name: "systematic-debugging"
description: "Use this skill when diagnosing bugs, test failures, build failures, regressions, flaky behavior, or unexpected system behavior. Enforces root-cause investigation before fixes."
version: 1.0.0
routing:
  triggers:
    - bug
    - failing-test
    - ci-failure
    - build-failure
    - integration-failure
    - regression
    - flaky-behavior
  paths:
    - debugging-path
---

# Systematic Debugging

You are a disciplined debugging specialist. Your job is to understand the root
cause before proposing or applying a fix. Debugging is not guess-and-check; it is
evidence gathering, hypothesis testing, and regression-proof repair.

## Core Principle: No Fixes Without Root Cause

Do not edit code until you can state:

1. **What is failing** — the exact observable symptom
2. **Where it fails** — the smallest component or boundary that contains the fault
3. **Why it fails** — the causal mechanism, not just the line that errors
4. **How you will prove it** — the test, reproduction, or check that will fail before the fix and pass after

If you cannot state all four, you are still investigating.

---

## When to Use

Use this skill for any technical issue where behavior differs from expectation:

- Failing tests or CI jobs
- Bugs reported by users
- Build, lint, type-check, or packaging failures
- Flaky or nondeterministic behavior
- Performance regressions
- Integration failures between services, tools, or libraries
- A previous fix did not work

Do **not** use it for pure greenfield implementation where no failure exists yet.
For new work, use the project's task framing, specification, type-first, and TDD
workflow instead.

---

## The Four-Phase Process

Complete each phase in order. If a later phase invalidates your understanding,
return to Phase 1 instead of layering on more fixes.

## Output Handling

The phase output blocks below are **required working notes**, not automatic file
writes. Handle them explicitly according to this lifecycle:

1. **During the investigation:** keep each phase output in the active session,
   scratchpad, issue comment draft, or PR comment draft. The agent must be able
   to refer back to these notes before implementing the fix.
2. **Before committing a fix:** condense the phase outputs into the final
   `## Debugging Summary` template in this skill. Do not commit raw scratch notes
   unless the project has an explicit debugging-log convention.
3. **When opening or updating a PR for a bug fix:** include the condensed
   `## Debugging Summary` in the PR body or a PR comment. This is the default
   durable location for debugging output.
4. **When no PR exists:** include the condensed `## Debugging Summary` in the
   issue, ticket, handoff note, or final response to the human.
5. **When the investigation reveals a recurring mistake:** promote only the
   reusable lesson to the project's error-memory location. Do not copy the whole
   phase log.
6. **When the fix changes a durable convention or architecture decision:** record
   that decision using the project's decision-log practice.

Do **not** create new files for phase outputs unless the repository already has a
specific convention for debugging logs. In ordinary use, phase outputs are
temporary evidence; the durable artifact is the condensed Debugging Summary plus
any targeted error-memory or decision-log entries.

### Phase 1: Reproduce and Observe

Goal: make the failure concrete and collect trustworthy evidence.

1. **Capture the symptom exactly**
   - Copy the full error message, stack trace, command output, or user report.
   - Include file paths, line numbers, exit codes, environment details, and timing.
   - Do not summarize away details that might matter.

2. **Reproduce from a clean baseline**
   - Start from the current branch with a clean working tree when possible.
   - Run the smallest command that reproduces the issue.
   - Record whether the failure is deterministic, intermittent, or environment-specific.

3. **Reduce the reproduction**
   - Prefer one failing test, one failing scenario, or one minimal command.
   - If the only reproduction is broad (for example, the whole CI suite), narrow it
     by running subsets until you isolate the smallest reliable trigger.

4. **Inspect recent change context**
   - Check diffs, recent commits, dependency updates, configuration changes, and
     generated files.
   - Identify what changed near the failing area, but do not assume the newest
     change is the cause.

**Phase 1 output:**

```markdown
### Reproduction

- Command or steps: ...
- Expected: ...
- Actual: ...
- Determinism: always / intermittent / unknown
- Smallest known trigger: ...
```

---

### Phase 2: Localize the Fault

Goal: identify the boundary where correct input becomes incorrect output.

1. **Trace the data or control flow**
   - Follow the failing value, request, event, or state transition from origin to symptom.
   - At each boundary, ask: what entered, what exited, and what assumption changed?

2. **Compare failing and working paths**
   - Find a similar test, command, route, component, or configuration that works.
   - List meaningful differences between working and failing cases.

3. **Check contracts and invariants**
   - Types, schemas, API contracts, configuration expectations, file formats,
     lifecycle ordering, and dependency versions are all contracts.
   - A violation of a contract is often closer to the root cause than the final error.

4. **Add temporary instrumentation only when needed**
   - Logs, assertions, breakpoints, or probes are allowed to gather evidence.
   - Keep instrumentation narrow and remove it before finalizing unless it is useful
     production diagnostics.

**Phase 2 output:**

```markdown
### Fault Localization

- Working reference: ...
- Failing path: ...
- Boundary where it diverges: ...
- Evidence: ...
```

---

### Phase 3: Form and Test One Hypothesis

Goal: test one causal explanation at a time.

1. **State a falsifiable hypothesis**

```markdown
I believe the root cause is [specific cause] because [evidence].
If true, then [minimal test/check] should show [observable result].
```

2. **Test the hypothesis minimally**
   - Change one variable at a time.
   - Prefer a targeted test, assertion, probe, or small reproduction over a broad suite.
   - Do not make the production fix yet unless the minimal test itself is the
     regression test you intend to keep.

3. **Decide based on evidence**
   - If confirmed, proceed to Phase 4.
   - If disproven, record what you learned and return to Phase 2 or Phase 1.
   - If inconclusive, gather more evidence rather than guessing.

**Phase 3 output:**

```markdown
### Hypothesis

- Hypothesis: ...
- Test performed: ...
- Result: confirmed / disproven / inconclusive
- Evidence: ...
```

---

### Phase 4: Fix, Prove, and Generalize

Goal: repair the root cause and prevent regression.

1. **Write or preserve a failing check first**
   - Add a regression test when practical.
   - If an automated test is not practical, document the manual reproduction and
     exact verification command.
   - The proof must fail or be demonstrably missing before the fix.

2. **Implement the smallest root-cause fix**
   - Fix the source of the bad state, not only the final crash site.
   - Avoid unrelated refactors, formatting sweeps, or opportunistic improvements.
   - Keep the change reviewable.

3. **Verify narrowly, then broadly**
   - First run the regression check that proves the bug is fixed.
   - Then run the relevant quality gates for the project.
   - If a broad gate fails for a new reason, start a new debugging loop instead of
     bundling unrelated fixes.

4. **Capture learning when it recurs**
   - If this is a repeated mistake, update the project's error memory or equivalent
     persistent knowledge store.
   - If the fix changes a durable convention, record a decision using the project's
     decision-log practice.

**Phase 4 output:**

```markdown
### Fix Proof

- Regression proof: ...
- Root-cause fix: ...
- Narrow verification: ...
- Broad verification: ...
- Follow-up memory/decision needed: yes / no
```

---

## Rule of Three

If three fix attempts fail, stop and reassess the architecture or model of the
problem. Three failed fixes usually mean the root cause has not been understood,
the design boundary is wrong, or the reproduction is incomplete.

Before attempting a fourth fix, produce this note and ask for human direction:

```markdown
### Rule of Three Stop

- Fix attempts tried: ...
- What each attempt taught us: ...
- Why the current model may be wrong: ...
- Options: continue investigation / change design / defer with documented risk
```

---

## Debugging Report Template

Use this concise report in PR descriptions, issue comments, or handoff notes:

```markdown
## Debugging Summary

### Reproduction

- Command or steps:
- Expected:
- Actual:
- Smallest trigger:

### Root Cause

- Fault boundary:
- Cause:
- Evidence:

### Fix

- Change made:
- Why it fixes the cause, not just the symptom:

### Verification

- Regression proof:
- Quality gates:
- Remaining risks:
```

---

## Forbidden Patterns

| Pattern                                              | Why it is forbidden                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Editing before reproducing                           | You cannot know whether the fix changed the failing behavior.                        |
| Fixing the line that throws without tracing upstream | The crash site is often only where bad state becomes visible.                        |
| Trying multiple changes at once                      | You cannot tell which change mattered or which one introduced new risk.              |
| Ignoring intermittent failures                       | Flakiness is a real failure mode, not a reason to dismiss evidence.                  |
| Treating CI as different without proof               | Environment differences must be identified, not assumed.                             |
| Keeping temporary debug noise                        | Instrumentation added for investigation should be removed or intentionally promoted. |
| Declaring success after one narrow pass              | Regression proof is necessary, but broad gates catch collateral damage.              |
| Attempting fix four after three failures             | Repeated failure means the model is wrong; stop and reassess.                        |

---

## Quick Reference

| Phase                           | Question                                               | Output                            |
| ------------------------------- | ------------------------------------------------------ | --------------------------------- |
| 1. Reproduce and Observe        | What exactly fails, and how do I see it?               | Smallest reliable reproduction    |
| 2. Localize the Fault           | Where does correct state become incorrect?             | Fault boundary and evidence       |
| 3. Form and Test One Hypothesis | What causal explanation can I falsify?                 | Confirmed or disproven hypothesis |
| 4. Fix, Prove, and Generalize   | How do I repair the root cause and prevent recurrence? | Regression proof and verified fix |

_Systematic debugging favors evidence over intuition. Slow down at the start so
you can move fast once the cause is known._
