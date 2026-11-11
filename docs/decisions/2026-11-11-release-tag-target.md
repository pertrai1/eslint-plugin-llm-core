---
date: 2026-11-11
task: Keep release tags aligned with the commit used to publish packages
domain: release-tag-target
kind: process
scope: repo
status: active
triggers:
  - changing the release workflow or handling a mismatched release tag
applies_to:
  - .github/workflows/release.yml
  - .github/scripts/release-tag.sh
supersedes: []
---

# Pin release tags to the publishing commit and reject mismatches

## Context

The v0.37.4 publishing run checked out commit 45b06c4, but `main` advanced
before `gh release create` ran. Without an explicit target, GitHub created the
tag at the newer commit and generated notes for code absent from that package.

## Decision and acceptance criteria

The release workflow must use its immutable `GITHUB_SHA` when creating a tag.
Before npm publication, and again before creating or skipping a GitHub release,
it must resolve any existing remote tag to its commit. Lightweight and annotated
tags at the publishing commit are valid. A different commit or a failed lookup
must stop the job with an actionable error, without moving or deleting the tag.
An absent tag is valid; creation must specify the publishing SHA. A matching
tag with an existing release remains an idempotent no-op.

A main-branch push with every package version already published must remain a
no-op: its existing tag belongs to the earlier publishing commit, not this
later push. Check registry versions first, and validate the tag only if package
publication is needed. Registry reads are allowed before validation; publishing
is not.

Regression tests must execute the workflow's shell steps with temporary local
Git repositories and a stub GitHub CLI, without publishing packages or making
network requests. Existing workspace test commands must run these tests.

## Rejected alternatives

- Relying on the default branch or release serialization does not pin a tag:
  another merge can still advance `main` while a release runs.
- Moving a mismatched public tag rewrites release history and can surprise
  existing consumers. Silently skipping it hides the inconsistency.
- Changing historical release notes or tags is a separate maintainer decision,
  not part of this workflow fix.

## Scope and recovery

Scope is the release workflow, one shell helper, focused regression tests, and
this decision/specification. Package code, manifests, dependency installation,
release notes, permissions, and publication triggers are unchanged.

A mismatch requires the maintainer to investigate the named tag and commits.
The workflow must not repair history automatically. A tag can still be changed
externally after a check; the checks reduce the window but are not a lock on
other actors. Tests use local substitutes for GitHub and do not prove a live
publication. Final pull-request CI verifies the supported Node 20/22 matrix.

The workflow still identifies a release by the core package version. If only
MCP or quality needs publishing and that core tag belongs to an earlier commit,
the same fail-closed rule stops publication for maintainer investigation.
Introducing per-package release identities is outside this fix.
