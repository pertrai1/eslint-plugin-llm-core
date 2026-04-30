---
name: test-driven-development
description: Defines RED/GREEN/REFACTOR expectations for behavior-changing implementation work and bug fixes.
version: 1.0.0
triggers:
  - behavior-change
  - new-feature
  - bug-fix
  - refactor-with-behavior
routing:
  load: conditional
---

# Test Driven Development Directive

## When to Use

Use TDD by default for behavior-changing code:

- New features
- Bug fixes
- Refactors that intentionally preserve or alter behavior
- Edge-case patches
- Review changes that affect runtime behavior

TDD is not required for purely mechanical or non-behavioral work selected by
`.agents/directives/ADAPTIVE_ROUTING.md`, such as docs-only edits, formatting-only
changes, generated files, metadata-only updates, or mechanical renames with no
behavior/API change. Those tasks still need the relevant quality gates.

If you are unsure whether a change affects behavior, choose TDD or ask one
concise clarifying question.

---

## ⚠️ DEFAULT: Strict RED/GREEN TDD for Behavior Changes

For behavior-changing work, follow strict Test-Driven Development. Do not skip
RED because the change seems obvious.

**Requirements:**

- One behavior per test
- Clear descriptive name ("and" in name? Split it)
- Real code, not mocks (unless truly unavoidable)
- Name describes behavior, not implementation

### The Cycle

```text
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐     │
│  │  RED    │ ───▶ │  GREEN  │ ───▶ │ REFACTOR│     │
│  │         │      │         │      │         │     │
│  │ Write   │      │ Write   │      │ Clean   │     │
│  │ failing │      │ minimum │      │ up code │     │
│  │ test    │      │ code    │      │         │     │
│  └─────────┘      └─────────┘      └─────────┘     │
│       ▲                                  │         │
│       └──────────────────────────────────┘         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## The Rules

### Rule 1: No Implementation Without a Failing Test

Before writing behavior-changing implementation code:

1. Write a test that describes ONE behavior
2. Run the test — it MUST fail (RED)
3. Only then write implementation

```text
❌ WRONG: Implement first, test later
✅ RIGHT: Test fails first, then implement
```

### Rule 2: Write ONE Test at a Time

- Never write multiple tests before implementing
- Never write tests for multiple methods at once
- One test = one behavior = one implementation cycle

### Rule 3: Write the MINIMUM Code to Pass

The GREEN phase is about making the test pass with the least code possible:

```typescript
// ❌ WRONG: Over-engineering
export function add(a: number, b: number): number {
  // What if they pass strings? What about overflow? Let me handle all cases...
  if (typeof a !== "number" || typeof b !== "number") {
    throw new TypeError("Arguments must be numbers");
  }
  const result = a + b;
  if (result > Number.MAX_SAFE_INTEGER) {
    console.warn("Potential overflow detected");
  }
  return result;
}

// ✅ RIGHT: Minimum to pass the test
export function add(a: number, b: number): number {
  return a + b;
}
```

If the test doesn't require it, don't implement it. YAGNI (You Aren't Gonna Need It).

### Rule 4: Verify Types After GREEN

After making a test pass, verify the implementation still satisfies the type contract:

Run the project's type-check command (for TypeScript projects, `tsc --noEmit`).

If types fail, the implementation is wrong. Fix before continuing.

### Rule 5: Never Refactor During GREEN

Refactoring happens AFTER the test passes, in a dedicated phase:

1. RED — Write failing test
2. GREEN — Make it pass (may be ugly)
3. REFACTOR — Clean up while keeping test green
4. Commit AFTER REFACTOR, not after GREEN

Never refactor while the test is still failing. Never refactor while writing new tests.

### Rule 6: No Skipping RED

You cannot:

- Comment out tests to make them "pass"
- Write tests that always pass
- Skip the RED phase because "I know what to implement"

If the test doesn't fail, the cycle is invalid.

### Rule 7: No Retrofitting

You cannot:

- Write implementation first, then write a test for it, then commit them
  in sequence to create the appearance of TDD
- Edit implementation and test files in the same editing pass before
  running tests between edits
- Hold implementation code in context while writing the "failing" test

The RED phase must produce genuine discovery. If you already wrote the
fix, the test is not driving anything — it's theater.

**Checkpoint:** After editing ONLY the test file, run the test suite.
Confirm the new test fails. This failure output is evidence that RED
happened. Do not open the implementation file until you have seen this
failure.

---

## The Workflow

### Step-by-Step Process

```text
1. Pick ONE method/behavior to implement

2. RED Phase:
   - Write a test for that behavior
   - Run test: MUST fail
   - If it passes, the test is wrong — fix it

3. GREEN Phase:
   - Write minimum code to make test pass
   - Run all tests: MUST pass (new test passes, no regressions)
   - Run type check: MUST pass

4. REFACTOR Phase (skip only if code is already clean):
   - Clean up implementation
   - Remove duplication
   - Improve readability
   - Extract helpers
   - Simplify expressions
   - Run all tests: MUST still pass
   - Run type check: MUST still pass

5. GATES — Run the project's full quality-gate command suite (test, lint, build/type-check). The specific commands depend on the project.
   All must pass. Fix failures before proceeding.

6. Commit AFTER GATES, not after GREEN

7. Return to step 1 for next behavior
```

---

## Examples

For a project-specific example, see Rule 7 (no retrofitting) above.

## TDD Applies to Fixes and Review Changes Too

Bug fixes, review feedback, and edge-case patches are NOT exempt from
the RED/GREEN cycle. The cycle is the same:

1. RED — Write a test that demonstrates the bug or missing edge case
2. Confirm it fails
3. GREEN — Write the fix
4. GATES + COMMIT

The temptation to "just fix it" is strongest for small changes. That
is exactly when discipline matters most — small changes have the
highest ratio of assumption to verification.

---

## Quality Gates

After each RED/GREEN/REFACTOR cycle, ALL of these must pass:

Run the project's full quality-gate command suite (test, lint, build/type-check). The specific commands depend on the project.

If any fail, the cycle is incomplete. Fix before moving to next test.

---

## Forbidden Patterns

| Pattern                             | Why Forbidden                          |
| ----------------------------------- | -------------------------------------- |
| `it.skip()`                         | Skipping tests defeats TDD             |
| `// TODO: write test later`         | No test = no implementation            |
| Implementing without a failing test | RED must precede GREEN — no exceptions |
| Copy-pasting tests to pass quickly  | Tests must reflect real behavior       |
| `expect(true).toBe(true)`           | Fake test, no constraint               |
| Writing test after implementation   | That's not TDD                         |

---

## The Commit Cadence

Commit AFTER GATES, not after GREEN

GREEN means it works. REFACTOR means it's clean. GATES means it's verified. Commit when all three are done.

```bash
git commit -m "feat: implement UserRepository.findById (found case)"
git commit -m "feat: implement UserRepository.findById (not found case)"
git commit -m "feat: implement UserRepository.findById (error handling)"
git commit -m "refactor: extract query logic in UserRepository"
```

Small commits = easy to review, easy to revert, easy to understand.

---

## Verification Checklist

Before marking work complete:

- [ ] Every behavior-changing function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason (feature missing, not typo)
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output pristine (no errors, warnings)
- [ ] Tests use real code (mocks only if unavoidable)
- [ ] Edge cases and errors covered

Can't check all boxes for behavior-changing work? You skipped TDD. Start over.

## Quick Reference

| Phase    | Action                                        | Must Be                         |
| -------- | --------------------------------------------- | ------------------------------- |
| RED      | Write test                                    | Failing                         |
| GREEN    | Write code                                    | Minimum to pass, no regressions |
| REFACTOR | Clean up                                      | All tests still pass            |
| GATES    | Run project quality gates (test, lint, build) | All pass                        |
| COMMIT   | Atomic commit                                 | One behavior per commit         |

---

## Final Rule

```text
Behavior-changing production code → test exists and failed first
Otherwise → not TDD
```

No exceptions for behavior-changing work without the user's explicit permission.
