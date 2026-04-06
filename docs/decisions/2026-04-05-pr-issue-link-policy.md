---
date: 2026-04-05
task: Relax PR template validation so pull requests without GitHub issues can still pass CI
domain: pr-issue-linking
kind: repo-policy
scope: repo
status: active
triggers:
  - editing pull request template policy
  - changing PR issue reference requirements
  - updating CI checks for PR descriptions
applies_to:
  - .github/PULL_REQUEST_TEMPLATE.md
  - .github/workflows/pr-checks.yml
supersedes: []
---

# Make GitHub issue references optional in PR descriptions

## Context

The PR checks workflow rejected any pull request whose description did not include
`Closes #<number>`, `Fixes #<number>`, or `Resolves #<number>`. That policy worked
for issue-driven changes, but it blocked maintenance and small cleanup PRs that did
not originate from a tracked issue. The real choice was whether to keep an explicit
marker for "no issue" or make the issue reference fully optional.

## Decision

Make GitHub issue references optional and remove the CI step that enforced them.
This keeps the PR template aligned with actual team practice, avoids forcing
placeholder issue references or synthetic tracking issues, and leaves issue-closing
keywords available when they are genuinely useful. The resulting policy is simpler:
checklist completion remains required, but issue linkage is only expected when a PR
actually resolves a tracked issue.

## Rejected Alternatives

### Require an explicit `Issue: none` marker

This would still add process overhead to PRs that have no corresponding issue while
providing little extra signal. Reviewers can already see whether a PR references an
issue, so a second opt-out marker would mostly create template churn.

### Keep the hard requirement and ask authors to file issues for every PR

This preserves a strict audit trail, but it turns lightweight maintenance work into
administrative work. For a small repository, that cost outweighs the benefit.

## Consequences

**Easier:** Opening small maintenance, documentation, and housekeeping PRs without
creating a tracking issue first.

**Harder:** Enforcing universal issue linkage as part of repo process.

**Watch for:** Contributors may stop linking related issues even when one exists, so
reviewers should still encourage issue references for feature work and bug fixes.
