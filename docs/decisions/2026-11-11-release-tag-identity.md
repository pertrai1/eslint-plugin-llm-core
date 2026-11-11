---
date: 2026-11-11
task: Let MCP-only and quality-only releases publish under the pinned-tag guard
domain: release-tag-identity
kind: process
scope: repo
status: active
triggers:
  - changing which tag or GitHub release identifies a published package
  - adding a published package to the release workflow
  - a release stopped by a tag that belongs to another package's version
applies_to:
  - .github/workflows/release.yml
  - .github/scripts/release-tag.sh
  - packages/eslint-plugin/tests/workflows/release-tag.test.ts
supersedes: []
---

# Identify each published package by its own release tag

## Context

The release workflow publishes whichever of the three packages has a version
npm lacks, but it identified every release by the core version: `v<core
version>`. [Pin release tags to the publishing commit](./2026-11-11-release-tag-target.md)
made a tag on a different commit stop the job before `npm publish`, and left
per-package identities out of scope. A release that bumps only
`eslint-plugin-llm-core-mcp` or `llm-core-quality` therefore finds the unchanged
core tag (for example `v0.37.7`) on an earlier commit and can never publish.
This record amends the last paragraph of that decision; everything else in it
still applies.

## Decision

Each published package has its own tag, created only when that package is
published, at the publishing `GITHUB_SHA`:

| Package                      | Tag                                    | GitHub "Latest"  |
| ---------------------------- | -------------------------------------- | ---------------- |
| `eslint-plugin-llm-core`     | `v<version>` (unchanged)               | default          |
| `eslint-plugin-llm-core-mcp` | `eslint-plugin-llm-core-mcp@<version>` | `--latest=false` |
| `llm-core-quality`           | `llm-core-quality@<version>`           | `--latest=false` |

Core keeps `v<version>` so its tag history stays continuous and no existing tag
is moved, deleted, or recreated. The other two use `<package-name>@<version>`,
the Changesets convention, which cannot collide with a core tag. The publish
step works out which packages need publishing, verifies every one of their tags
with `release-tag.sh --verify-only`, and only then publishes; a mismatch or
failed lookup on any needed tag publishes nothing. It hands the published tags
to the release step, which verifies them all again and then creates one GitHub
release per tag. A package that is not being published has its tag neither
checked nor created. The mismatch check in `release-tag.sh` is unchanged; the
script only gained pass-through of extra `gh release create` arguments.

Non-core releases pass `--latest=false` so the repository's "Latest" release
keeps pointing at the plugin, which is what the repository is named for and what
most visitors install.

Release notes stay on `--generate-notes`. GitHub's notes API, asked to preview
a package-scoped tag on current `main`, compared against the most recent
release (`v0.37.7`) and titled the release with the tag name. Notes therefore
list pull requests merged since the previous release of _any_ package, not
changes filtered to that package. Each package's `CHANGELOG.md` remains the
per-package record.

## Rejected Alternatives

### Batch every MCP or quality change with a core release

Works with no workflow change, but makes a fix to one package wait for an
unrelated core change, or forces an empty core bump to carry it. It also leaves
the trap in place for the next package-only version PR.

### Skip the tag check when core is not being published

Publishes, but creates no tag or release for the package that was published, so
that npm version has no pinned commit. That is the gap the pinned-tag decision
closed.

### Move or re-point the core tag to the new commit

Rewrites public release history and is explicitly ruled out by the pinned-tag
decision and the maintainer.

### Rename core tags to `eslint-plugin-llm-core@<version>`

Uniform, but breaks continuity with every existing `v*` tag and any consumer or
tool that reads them, for no functional gain.

### Filter generated notes per package with `--notes-start-tag`

Needs a lookup of the previous tag for the same package and still lists pull
requests by commit range, not by package. The changelogs already carry the
per-package view.

## Consequences

**Easier:** Any subset of the three packages can release independently. Each
npm version maps to one tag on the commit that published it.

**Harder:** The releases page mixes three tag schemes. Adding a published
package now means adding a `plan` line with its tag prefix in `release.yml` and
a matching test.

**Watch for:** When several packages publish in one run, their releases share a
commit, so generated notes for the later ones may be empty apart from the
changelog link; this was not exercised against GitHub. Tags are created only
for packages published in the same run: if a later `npm publish` or
`gh release create` fails after an earlier package is already on npm, the rerun
sees that package as published and will not tag it. The maintainer must then
create that release by hand with `--target <publishing sha>`. The same gap
existed for the single core tag when release creation failed.

**Unlearn:** "The newest `v*` tag is the last commit anything was published
from" no longer holds; a later MCP or quality release can sit on a newer commit.
