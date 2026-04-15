---
applyTo: "**"
---

# Pull Request Requirements

## Before Opening a PR

Run all quality gates locally:

```bash
npm test && npm run lint && npm run build
```

If rules were added or changed, also run:

```bash
npm run update:eslint-docs
```

## Changeset

**Required when `src/` is modified.** CI enforces this — PRs that touch `src/` without a changeset will fail.

This project uses [Changesets](https://github.com/changesets/changesets) for versioning — never run `npm run version` locally.

```bash
npx changeset
```

The changeset file goes in `.changeset/<name>.md`. Commit it alongside the code changes. CI handles the actual version bump when the PR merges. Docs-only, workflow-only, or AGENTS.md-only changes do not require a changeset.

**Bump guidance:**

- `patch` — bug fixes, message wording tweaks
- `minor` — new rules, new options, new features
- `major` — breaking changes (removed rules, changed defaults)

## PR Template (CI-Enforced)

The PR template at `.github/PULL_REQUEST_TEMPLATE.md` has required sections for the checklist and, when applicable, agent disclosure. **CI will block merge if those are incomplete.**

### 1. Related Issue (Optional)

If a PR resolves a tracked GitHub issue, include `Closes #<number>`, `Fixes #<number>`, or `Resolves #<number>` in the PR description. If no issue exists, no issue reference is required.

### 2. Verification (Required for all code changes)

Include a `## Verification` section in the PR body following the protocol in `.agents/directives/VERIFICATION.md`. For new rules and bug fixes, this means detection proof, test coverage, contract proof, and docs proof. For other code changes (CLI features, refactors, config), demonstrate correctness with evidence — test output, manual verification, or behavioral proof.

Docs-only changes (no `src/` modifications) may omit the verification section.

### 3. Checklist

Every box must be checked. If a checklist item doesn't apply, check it and note "(N/A)" next to it.

```markdown
- [x] `npm run build` passes
- [x] `npm run test` passes (new tests added if applicable)
- [x] `npm run lint` passes
- [x] `npm run update:eslint-docs` ran (if rules were added or changed)
- [x] Docs added/updated (if adding a new rule: `docs/rules/<rule-name>.md`)
- [x] Rule exported in `src/rules/index.ts` (if adding a new rule)
- [x] Rule added to `recommendedRules` in `src/index.ts` (if applicable)
```

### 4. Agent Disclosure

If you are an AI agent, you MUST complete this section:

- **Agent:** — Write your name (e.g., "GitHub Copilot", "Claude Code")
- **Instruction files loaded:** — Check every file you actually received and processed
- **Instruction files NOT loaded:** — Explain any gaps

### 5. Commit History

CI enforces that PRs with `feat:` commits must include at least one `test:` commit. Follow the commit cadence in `copilot-instructions.md` (test-first ordering is expected by convention).
