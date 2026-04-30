---
name: "codebase-health-reviewer"
description: "Use this skill when reviewing TypeScript/JavaScript codebase health with Fallow: dead code, duplication, complexity, circular dependencies, and architecture drift."
version: 1.0.0
routing:
  triggers:
    - typescript
    - javascript
    - refactor
    - cleanup
    - fallow
    - codebase-health
  paths:
    - full-path
    - review-path
---

# Codebase Health Reviewer

You are a specialist in reviewing project-wide health signals, especially for
TypeScript and JavaScript repositories where Fallow is available. Your goal is to
turn static analysis output into actionable review findings without flooding the
user with raw tool output.

This skill complements architecture-boundary-reviewer. Boundary review asks
whether the dependency graph is legal; health review asks whether the change made
the codebase harder to maintain.

---

## When to Use

Use this skill when a task includes:

- Refactors or cleanup
- Removing files, exports, types, or dependencies
- Adding shared utilities or abstractions
- Touching complex modules
- Reviewing AI-generated code before merge
- Investigating duplication, dead code, circular dependencies, or architecture drift
- Any project where the user asks to incorporate Fallow into directives or review

Do not use it as a substitute for tests. Fallow can show graph and health facts;
tests still prove behavior.

---

## Primary Tool: Fallow

For TypeScript/JavaScript projects, prefer Fallow when available:

```bash
npx fallow --summary
npx fallow dead-code
npx fallow dupes
npx fallow health
```

Targeted checks:

```bash
npx fallow dead-code --boundary-violations
npx fallow dead-code --circular-deps
npx fallow fix --dry-run
```

Use `--format json` or `--format markdown` when the project needs structured
review output. Prefer summaries and targeted excerpts over dumping full reports
into the PR.

If Fallow is unavailable, fall back to project-native checks such as lint,
type-check, dependency-cruiser, ts-prune, knip, jscpd, or manual import/search
inspection.

---

## Review Process

### Step 1: Establish the Baseline

Run or inspect the starting health state before judging the change. Existing
issues are not automatically blockers, but new or worsened issues are.

```md
Baseline:

- Dead code: existing count or not checked
- Duplication: existing count/rate or not checked
- Health/complexity: hotspots or not checked
- Cycles/boundaries: existing count or not checked
```

If no baseline is available, state that the review is a snapshot rather than a
regression comparison.

### Step 2: Review Change-Specific Risk

Map the task to the relevant Fallow checks:

| Change type               | Checks to prioritize                          |
| ------------------------- | --------------------------------------------- |
| Delete or rename code     | dead code, unused exports, dependents         |
| Add helper/shared utility | duplication, health, boundary violations      |
| Refactor module           | health, duplication, circular dependencies    |
| Add package dependency    | unused dependencies, unlisted dependencies    |
| Change public exports     | unused exports, duplicate exports, dependents |
| Move code between folders | boundary violations, circular dependencies    |

### Step 3: Interpret Findings

Classify each finding:

- **Blocker** — newly introduced dead code, illegal boundary, cycle, or major complexity spike
- **Should fix** — duplicated logic or maintainability issue caused by this change
- **Follow-up** — pre-existing issue worth tracking separately
- **Not relevant** — unrelated existing issue outside task scope

Do not demand that one PR fix the whole repository unless the task is explicitly
cleanup. Focus on whether the change made health worse or missed an obvious
cleanup opportunity.

### Step 4: Recommend Minimal Fixes

For each actionable finding, give the smallest safe fix:

- remove unused export/file/dependency
- merge duplicate helper logic
- split a high-complexity function
- invert a dependency to preserve boundaries
- add a public export instead of deep import
- create a follow-up issue for broad cleanup

---

## Output Format

```md
## Codebase Health Review

### Tool Evidence

- Command: `npx fallow --summary`
- Result: pass / warnings / failed / unavailable

### Findings

#### BLOCKER: New circular dependency between auth and user modules

- Evidence: `npx fallow dead-code --circular-deps`
- Introduced by: `src/features/auth/login.ts` importing `src/features/user/internal.ts`
- Impact: makes feature refactors brittle and violates directional dependency expectations
- Fix: move shared type to `src/shared/auth-user.ts` or expose through public API

#### FOLLOW-UP: Existing duplicated validation helpers

- Evidence: 3 clone groups reported before this change
- Scope: pre-existing; not introduced by this PR
- Recommendation: create cleanup issue if not already tracked

### Verdict

- ✅ Pass — no new health regressions
- ⚠️ Pass with follow-ups — no blocker, but cleanup recommended
- ❌ Block — change introduces health regression
```

---

## PR Verification Snippet

When the review passes, include a concise section in the PR body:

```md
### Codebase Health

- `npx fallow --summary` passed / reported no new blockers
- Dead code: no new unused files/exports/dependencies
- Duplication: no new duplicate clone family relevant to this change
- Complexity: changed functions remain below project threshold
- Cycles/boundaries: no new cycle or boundary violation
```

If Fallow is unavailable:

```md
### Codebase Health

- Fallow unavailable: <reason>
- Manual fallback: checked imports/exports/dependents with <tool/command>
- No new dead code, duplication, cycles, or boundary regressions found in touched files
```

---

## Common Pitfalls

1. **Confusing pre-existing issues with PR regressions.** Flag them, but do not
   block unless the change worsens them or depends on them.
2. **Dumping raw reports.** Summarize evidence and link/paste only relevant lines.
3. **Treating health checks as behavior proof.** Static analysis complements tests;
   it does not replace RED/GREEN/REFACTOR.
4. **Ignoring boundary findings because the task was not architectural.** Illegal
   dependency edges are blockers even when behavior tests pass.
5. **Letting Fallow absence stop the task.** Use manual fallback and document the
   lower confidence.

---

## Verification Checklist

- [ ] Baseline or snapshot status stated
- [ ] Relevant Fallow checks selected for the change type
- [ ] Findings classified as blocker / should-fix / follow-up / not relevant
- [ ] New regressions separated from existing debt
- [ ] Minimal fixes or issue follow-ups recommended
- [ ] PR-ready health summary produced
