---
name: "code-reviewer"
description: "Load when the user asks to review a PR, branch, diff, local changes, or says approve, merge, or check this change for bugs, regressions, security, maintainability, or merge risk."
version: 1.2.0
required: true
category: review
tools:
  - claude
  - copilot
  - codex
  - cursor
routing:
  triggers:
    - pull-request
    - pr-review
    - code-review
    - branch-review
    - diff-review
    - merge-risk
  paths:
    - review-path
---

## Review Depth

Default to the lightest useful review.

### Fast Path

Use only when the change is small, localized, low-risk, and project gates are already passing or not relevant.

Output:

- Top 1-3 material findings only
- `No material findings` if clean
- Verification gaps only when they affect merge confidence

Do not emit the full checklist when there are no findings.

### Deep Path

Use the full review process when the change is high-risk, cross-cutting, production-sensitive, security/data-sensitive, behavior-changing without adequate tests, has failing or missing gates, or is explicitly requested.

# Code Review Guidelines

When reviewing a pull request, branch, diff, or local change:

## Step 0: The Review Brief

Before writing the actual review, produce a compact Review Brief to focus your attention on material risk zones.

**Storage:**

- In **autonomous loops**, write this brief to `.agents/review-brief.md` (or submit it directly as a PR comment/draft via API).
- In **interactive sessions**, you may output it directly to the user or save it to `.agents/review-brief.md` for later reference.

```text
Reviewing PR/Issue [ID/Name].

Focus areas:
- Risk areas: <security, migration, CI, or performance risks>
- Files that must be inspected: <source files containing the core logic>
- Edge cases to test: <untrusted input, boundaries, empty states>
- Required commands: <test, lint, and build execution scripts>
- What counts as blocking: <what will trigger a REQUEST_CHANGES verdict>
- What should be ignored: <known style differences, non-blocking pre-existing debt>
```

## Review Heuristics (What to Check)

Do not just read the code top-to-bottom. Apply these specific checks:

| Severity        | Check                     | Heuristic / Action                                                                                                                                                                                                                                                                                                                                           |
| :-------------- | :------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **🛑 Critical** | **CI & Config Changes**   | Look at `.github/workflows`, test configs, and lint rules first. Flag any change that weakens CI, ignores rules, or deletes tests to "fix" them.                                                                                                                                                                                                             |
| **🛑 Critical** | **Evidence Requirements** | For any non-trivial logic change, require a test that fails on the pre-change behavior.                                                                                                                                                                                                                                                                      |
| **⚠️ Warning**  | **New Utilities (DRY)**   | Search for new functions, helpers, or modules. Run a repo search to check for duplicates. Flag anything that reinvents existing codebase functionality.                                                                                                                                                                                                      |
| **⚠️ Warning**  | **Structural Regression** | Flag changes that make the codebase harder to reason about: ad-hoc branches in busy flows, feature checks scattered through shared paths, unnecessary wrappers, cast-heavy contracts, duplicated helpers, or logic added in the wrong layer. Prefer fixes that delete complexity, reuse the canonical owner/helper, or make the data/type boundary explicit. |
| **🔍 Trace**    | **Critical Path**         | Pick the most important logic change and trace it end-to-end: input → transforms → output. Check boundary conditions and unexpected branching.                                                                                                                                                                                                               |
| **🔍 Trace**    | **Security Boundaries**   | If the PR touches untrusted input or LLM calls, explicitly check for prompt injection, auth bypass, and missing sanitization.                                                                                                                                                                                                                                |

## Standard Categories

## Output Format

For each finding:

- **File:Line** — exact location
- **Severity** — Critical / Warning / Trace / Suggestion
- **What's wrong** — one sentence
- **Fix** — how to fix it

## Rules

- Be specific. Quote the problematic code.
- Don't flag style nitpicks unless they affect readability.
- Before accepting a complex implementation, ask whether the same behavior can be achieved by deleting branches, reusing an existing abstraction, moving logic to the canonical owner, or making the data/type boundary explicit.
- Do not approve merely because behavior works. If the implementation creates obvious structural debt, spaghetti branching, duplicated abstractions, or unclear type/boundary contracts, call that out as a material review finding.
- Treat these as merge-blocking unless clearly justified: scattered feature-specific conditionals in shared flows, duplicated helpers/models, casts or optionality that hide real invariants, wrappers that add indirection without reducing complexity, or modules made materially harder to scan, test, or own.
- If the PR looks good, say so. Don't invent problems.
- End with: APPROVE / REQUEST_CHANGES / COMMENT
