# Verification Protocol

## Prerequisite: Implementation Must Pass GATES First

This directive applies after REFACTOR and before the final GATES run:

```
1. Define types              → [TYPE_DRIVEN_DEVELOPMENT](./TYPE_DRIVEN_DEVELOPMENT.md)
2. Write failing test        → [TEST_DRIVEN_DEVELOPMENT](./TEST_DRIVEN_DEVELOPMENT.md)
3. Implement minimum code    → driven by failing tests
4. Refactor                  → clean up, all tests pass
5. **Verify**                → this file — demonstrate correctness with evidence
6. GATES + DOCS + COMMIT     → final quality gates
```

**Do not run GATES until verification output is produced.** Verification
catches issues that passing tests alone cannot: false positives, missing
edge cases, wrong config placement, and incomplete documentation.

---

## Why Verification Matters

Passing tests prove the code works for tested inputs. They do NOT prove:

- The rule catches what it should in real code (not just test fixtures)
- The rule avoids false positives on valid patterns
- The structured error message reads correctly in context
- The rule is properly exported, configured, and documented

Verification bridges the gap between "tests pass" and "rule is production-ready."
Think of it as the agent showing its work, not just reporting a green checkmark.

---

## The Protocol

After REFACTOR and before GATES, the agent MUST produce a verification
summary. The summary is structured evidence that a reviewer can scan in
30 seconds instead of reading the full implementation.

### For New Rules

Output ALL four sections:

#### 1. Detection Proof

Run the compiled rule against representative code. Show:

- **Hits** — one case that triggers the error, with the full structured message
  (what / why / how-to-fix)
- **Clean passes** — one case that does NOT trigger the error, proving no
  false positive

```bash
# Build first
npm run build

# Write a temporary test file with the triggering code
echo '<triggering code>' > /tmp/verify-rule.ts

# Run ESLint with the plugin loaded from dist/
# Use a minimal flat config that imports the built plugin:
npx eslint /tmp/verify-rule.ts \
  --config <(echo 'import p from "./dist/index.js"; export default [...p.configs.all];')

# For the clean-pass case, write valid code and re-run
echo '<valid code that should NOT trigger>' > /tmp/verify-rule.ts
npx eslint /tmp/verify-rule.ts \
  --config <(echo 'import p from "./dist/index.js"; export default [...p.configs.all];')
```

If inline config is not practical, create a temporary `eslint.verify.mjs` in the
project root, run the check, then delete it. Alternatively, show test output that
proves detection and clean-pass behavior using vitest verbose reporter.

#### 2. Test Coverage Proof

```bash
npx vitest run tests/rules/rule-name.ts --reporter=verbose
```

List passing test cases grouped by:

- **Valid cases** — code that should NOT be flagged
- **Invalid cases** — code that SHOULD be flagged
- **Edge cases** — null, undefined, empty, boundary values
- **Suggestion cases** — autofix or suggestion output (if applicable)

#### 3. Contract Proof

Confirm all of the following. Output `[x]` for confirmed, `[ ]` for missing:

- [ ] Rule exported from `src/index.ts`
- [ ] Rule in correct config preset (`recommended`, `all`, category configs)
- [ ] `meta.docs.url` points to correct docs path
- [ ] `meta.schema` defined (if rule accepts options)
- [ ] Error message follows what / why / how-to-fix format
- [ ] Suggestions use actual code context (function names, params), not generics

#### 4. Docs Proof (if rule changed)

```bash
npm run update:eslint-docs
git diff --stat docs/rules/
```

Confirm generated docs exist and are consistent with the rule.

---

### For Bug Fixes

After the fix, show:

1. **The previously-failing test now passing** — paste the test name and result
2. **The fix** — a one-paragraph summary of what changed in the rule logic
3. **No regression** — all existing tests still pass

```bash
npx vitest run --reporter=verbose
```

---

### For Docs / Chore Changes

Show the relevant quality gate still passes:

```bash
npm test && npm run lint && npm run build
```

Paste the output. That IS the verification for non-rule changes.

---

## Output Location: Pull Request Body

The verification summary MUST be included in the PR description when the
agent opens a pull request. This keeps the evidence next to the code it
verifies, and the reviewer can scan it in 30 seconds without leaving the PR.

When opening a PR, include a `## Verification` section in the PR body
(between the checklist and agent disclosure). The summary should look like
this:

```markdown
## Verification

### Detection

✅ Hit: `if (x) { a(); } else { b(); }` → error with structured message
✅ Clean: `if (x) { a(); return; } b();` → no error

### Tests (12 passing)

- Valid (4): early return, guard clause, if-without-else, nested-if
- Invalid (5): if-else-return, else-if-chain-return, nested-else-return, ternary-else, try-catch-else
- Edge (2): empty-else-block, single-statement-else
- Suggestions (1): converts if-else to early-return

### Contract

[x] Exported from src/index.ts
[x] In recommended + all + best-practices configs
[x] meta.docs.url → docs/rules/no-else-return.md
[x] meta.schema defined (maxElseChains option)
[x] Message format: what / why / how-to-fix
[x] Suggestions use actual code context

### Docs

[x] Regenerated, docs/rules/no-else-return.md updated
```

If anything is `[ ]` or tests are missing, the implementation is not ready.
Do not open the PR until verification is complete.

For bug fixes and docs/chore changes, include a shorter verification
block in the same PR section.

---

## Forbidden Patterns

| Pattern                                      | Why Forbidden                                             |
| -------------------------------------------- | --------------------------------------------------------- |
| "Tests pass, ship it"                        | Passing tests ≠ production-ready rule                     |
| Skipping detection proof                     | Must show both hits AND clean passes                      |
| Skipping contract proof                      | Misconfigured rules pass tests but fail in users' editors |
| Claiming verification without showing output | Evidence, not claims                                      |
| Running GATES before verification            | Verification catches issues GATES misses                  |

---

## Why This Matters for LLM Agents

LLM agents tend to:

1. **Implement the happy path** — forget edge cases and false positives
2. **Skip wiring** — write the rule but forget to export or configure it
3. **Generate generic messages** — "Unexpected pattern" instead of using code context
4. **Skip docs** — forget `npm run update:eslint-docs`

Verification forces the agent to confront each of these before declaring done.
It transforms "I think it works" into "here's the evidence it works."

---

_This directive is mandatory for all rule implementations, bug fixes, and config changes._
