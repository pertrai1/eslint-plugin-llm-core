---
name: verification
description: Requires structured evidence of correctness before quality gates and pull requests.
version: 1.0.0
triggers:
  - verification
  - pre-pr
  - quality-gates
  - implementation-complete
routing:
  load: conditional
---

# Verification Protocol

**When to load:** Load this directive after completing the REFACTOR phase and before running final quality gates (GATES).

**Do not run GATES until verification output is produced.** Verification
catches issues that passing tests alone cannot: false positives, missing
edge cases, wrong configuration, and incomplete documentation.

---

## The Protocol

After REFACTOR and before GATES, the agent MUST produce a verification
summary. The summary is structured evidence that a reviewer can scan in
30 seconds instead of reading the full implementation.

### For New Features or Changes

Output all applicable sections. The protocol defines three sections that apply
to every new feature or change, plus conditional sections for architecture
boundaries, codebase health, and documentation when relevant.

#### 1. Functional Proof

Demonstrate the change does what it claims. Show:

- **Hit** — one input or scenario that produces the expected new behavior
- **Clean pass** — one input or scenario that should NOT be affected, proving
  no false positive

_Example (adapt to your project):_

```
✅ Hit: calling createUser({ name: "Alice" }) returns { id: "usr_1", name: "Alice" }
✅ Clean: calling createUser({}) returns validation error, no user created
```

#### 2. Test Coverage Proof

List passing test cases grouped by:

- **Happy path** — expected inputs with expected outputs
- **Error cases** — invalid inputs, failure conditions
- **Edge cases** — null, undefined, empty, boundary values
- **Suggestion/fix cases** — autofix or suggestion output (if applicable)

_Example command (adapt to your project's test runner):_

```bash
# For example, with vitest:
npx vitest run --reporter=verbose
```

#### 3. Integration Proof

Confirm the change is wired into the project correctly. Output `[x]` for
confirmed, `[ ]` for missing:

- [ ] Exported/registered in the appropriate entry point
- [ ] Included in the relevant configuration or module
- [ ] Public API (types, function signatures) matches usage
- [ ] Error messages are clear and actionable

_Example (adapt to your project's structure):_

```
[x] Exported from the appropriate entry point
[x] Registered in config module
[x] Public types match call sites
[x] Error messages follow project conventions
```

#### 4. Architecture Boundary Proof (if applicable)

Required when the change touches imports, exports, package boundaries, shared
code, service boundaries, or folder/layer structure. Show:

- Modified zones/layers/packages
- Changed dependency edges
- Evidence that no upward, sideways, cyclic, or public-API-bypassing import was introduced
- Tool evidence when available, e.g. `npx fallow dead-code --boundary-violations`

_Example:_

```md
[x] `feature/auth` imports only `shared` and public `domain` APIs
[x] No sibling feature internal imports
[x] `npx fallow dead-code --boundary-violations` reports 0 violations
```

#### 5. Codebase Health Proof (if applicable)

For TypeScript/JavaScript refactors, cleanup, shared utilities, or AI-generated
changes where Fallow is available, include concise health evidence:

```bash
npx fallow --summary
npx fallow dupes
npx fallow health
```

Summarize only relevant findings: new dead code, duplication, complexity, cycles,
or boundary regressions. Separate pre-existing debt from issues introduced by
the change.

#### 6. Documentation Proof (if applicable)

- [ ] API documentation updated
- [ ] README or usage docs updated (if public-facing change)

_Example:_

```
[x] JSDoc updated on changed functions
[x] README usage section updated
```

---

### For Bug Fixes

After the fix, show:

1. **The previously-failing test now passing** — paste the test name and result
2. **The fix** — a one-paragraph summary of what changed in the logic
3. **No regression** — all existing tests still pass

Run the project's test suite with verbose output to confirm.

---

### For Docs / Chore Changes

Show the relevant quality gate still passes:

Run the project's full quality-gate command suite (test, lint, build/type-check).

Paste the output. That IS the verification for non-code changes.

---

## Output Location: Pull Request Body

The verification summary MUST be included in the PR description when the
agent opens a pull request. This keeps the evidence next to the code it
verifies, and the reviewer can scan it in 30 seconds without leaving the PR.

When opening a PR, include a `## Verification` section in the PR body.
The summary should follow this structure:

```markdown
## Verification

### Functional

✅ Hit: calling createUser({ name: "Alice" }) → returns user with id
✅ Clean: calling createUser({}) → validation error, no side effects

### Tests (12 passing)

- Happy path (4): valid input, optional fields, default values, nested objects
- Error cases (5): missing required field, invalid type, duplicate key, null input, empty string
- Edge cases (2): max-length name, unicode characters
- Suggestions (1): suggests trim on whitespace-padded name

### Integration

[x] Exported from src/users/create.ts
[x] Registered in user module
[x] Public types match call sites
[x] Error messages follow project conventions

### Architecture Boundaries

[x] Modified files stay within allowed dependency direction
[x] No new circular dependencies or public API bypasses

### Documentation

[x] JSDoc updated on createUser
[x] README usage section updated
```

If anything is `[ ]` or tests are missing, the implementation is not ready.
Do not open the PR until verification is complete.

For bug fixes and docs/chore changes, include a shorter verification
block in the same PR section.

---

## Quality Gate Feedback

Run the project-native gates selected by `.agents/directives/ADAPTIVE_ROUTING.md`.
Treat test, lint, type-check, build, static-analysis, and review-bot output as
implementation feedback, not ceremony.

When a linter or static-analysis rule explains an issue, fix the underlying
pattern. Do not suppress the rule, weaken configuration, or make superficial
rewrites unless the project explicitly allows that exception and the reason is
documented.

If a finding is pre-existing or outside the task scope, state that classification
and show that the current change did not make it worse.

---

## Forbidden Patterns

| Pattern                                        | Why Forbidden                                           |
| ---------------------------------------------- | ------------------------------------------------------- |
| "Tests pass, ship it"                          | Passing tests ≠ production-ready                        |
| Skipping functional proof                      | Must show both expected behavior AND no false positive  |
| Skipping integration proof                     | Misconfigured code passes tests but fails in production |
| Skipping boundary proof for dependency changes | Passing tests do not prove architectural validity       |
| Claiming verification without showing output   | Evidence, not claims                                    |
| Running GATES before verification              | Verification catches issues GATES misses                |

---

_This directive is mandatory for all implementations, bug fixes, and configuration changes._
