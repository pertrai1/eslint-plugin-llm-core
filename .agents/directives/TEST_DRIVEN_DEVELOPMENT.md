# Test Driven Development Directive

## Prerequisite: Types Must Exist First

This directive is step 2 of the implementation pipeline:

```
1. Define types/interfaces     → [TYPE_DRIVEN_DEVELOPMENT](./TYPE_DRIVEN_DEVELOPMENT.md)
2. Write tests against types   → this file (TDD)
3. Implement minimum code      → driven by failing tests
```

**Do not write tests until types are defined and verified with `tsc --noEmit`.** Types constrain structure; tests constrain behavior. Together they force minimal, correct implementations.

---

## ⚠️ MANDATORY: Strict RED/GREEN TDD

After types are defined, you MUST follow strict Test-Driven Development. This is non-negotiable.

### The Cycle

```
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

Before writing ANY implementation code:

1. Write a test that describes ONE behavior
2. Run the test — it MUST fail (RED)
3. Only then write implementation

```
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

```bash
npx tsc --noEmit
```

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

```
1. Types are defined (from [TYPE_DRIVEN_DEVELOPMENT](./TYPE_DRIVEN_DEVELOPMENT.md))

2. Pick ONE method/behavior to implement

3. RED Phase:
   - Write a test for that behavior
   - Run test: MUST fail
   - If it passes, the test is wrong — fix it

4. GREEN Phase:
   - Write minimum code to make test pass
   - Run all tests: MUST pass (new test passes, no regressions)
   - Run type check: MUST pass

5. REFACTOR Phase (skip only if code is already clean):
   - Clean up implementation
   - Run all tests: MUST still pass
   - Run type check: MUST still pass

6. GATES — Run full quality gates before committing:
```

npm test && npm run lint && npm run build

```
All must pass. Fix failures before proceeding.

7. Commit AFTER GATES, not after GREEN

8. Return to step 2 for next behavior
```

---

## Examples

### Example 1: Implementing a Repository Method

**Given types:**

```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
}

type User = { id: string; name: string; email: string };
```

**Cycle 1: Found User Case**

```typescript
// RED: Write failing test
describe("UserRepository.findById", () => {
  it("should return user when found", async () => {
    const repo = createUserRepository({ db: mockDb });
    mockDb.query.mockResolvedValue({
      id: "123",
      name: "Alice",
      email: "alice@test.com",
    });

    const user = await repo.findById("123");

    expect(user).toEqual({ id: "123", name: "Alice", email: "alice@test.com" });
  });
});

// Run test: ❌ Fails (createUserRepository doesn't exist)
```

```typescript
// GREEN: Minimum implementation
export const createUserRepository = (deps: {
  db: Database;
}): UserRepository => {
  return {
    findById: async (id: string) => {
      const row = await deps.db.query("SELECT * FROM users WHERE id = $1", [
        id,
      ]);
      return row ? { id: row.id, name: row.name, email: row.email } : null;
    },
  };
};

// Run test: ✅ Passes
// Run tsc: ✅ Passes
```

**Cycle 2: Not Found Case**

```typescript
// RED: Write failing test for next behavior
it("should return null when user not found", async () => {
  const repo = createUserRepository({ db: mockDb });
  mockDb.query.mockResolvedValue(null);

  const user = await repo.findById("nonexistent");

  expect(user).toBeNull();
});

// Run test: ✅ Passes (accidentally!)
// Problem: Test doesn't fail. Fix the test or confirm implementation is correct.
```

Wait — the test passes because our implementation already handles `null`. Good. Move to next behavior.

**Cycle 3: Database Error Case**

```typescript
// RED: Write failing test
it("should throw DatabaseError on query failure", async () => {
  const repo = createUserRepository({ db: mockDb });
  mockDb.query.mockRejectedValue(new Error("Connection lost"));

  await expect(repo.findById("123")).rejects.toThrow(DatabaseError);
});

// Run test: ❌ Fails (throws Error, not DatabaseError)
```

```typescript
// GREEN: Minimum implementation to pass
export const createUserRepository = (deps: {
  db: Database;
}): UserRepository => {
  return {
    findById: async (id: string) => {
      try {
        const row = await deps.db.query("SELECT * FROM users WHERE id = $1", [
          id,
        ]);
        return row ? { id: row.id, name: row.name, email: row.email } : null;
      } catch (err) {
        throw new DatabaseError("Query failed", { cause: err });
      }
    },
  };
};

// Run test: ✅ Passes
// Run tsc: ✅ Passes
```

---

### Example 2: What NOT To Do

```typescript
// ❌ WRONG: Writing multiple tests at once
describe('UserRepository', () => {
  it('should find by id', async () => { /* ... */ });
  it('should find by email', async () => { /* ... */ });
  it('should create user', async () => { /* ... */ });
  it('should update user', async () => { /* ... */ });
  it('should delete user', async () => { /* ... */ });
});

// Now implement all at once...
export const createUserRepository = ... // 100 lines of code

// Problem: Which test fails when something breaks? Hard to debug.
```

```typescript
// ✅ RIGHT: One test, one cycle
describe("UserRepository", () => {
  it("should find by id", async () => {
    /* ... */
  });
});
// Implement findById only

// Next cycle
describe("UserRepository", () => {
  it("should find by id", async () => {
    /* ... */
  });
  it("should find by email", async () => {
    /* ... */
  });
});
// Implement findByEmail only

// etc.
```

---

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

## Why This Matters for LLM Agents

### The Agent Drift Problem

Without TDD, LLM agents:

1. **Over-implement** — Solve problems you didn't ask about
2. **Over-abstract** — Build frameworks for simple features
3. **Guess intent** — Add features they think you might want
4. **Skip edge cases** — Or handle edge cases that don't exist
5. **Lose focus** — Drift into unrelated improvements

### TDD as a Constraint

With strict TDD, the agent:

1. **Implements exactly** what the test requires
2. **Stops** when the test passes
3. **Moves** to the next failing test
4. **Cannot drift** — the test is the budget

### The Numbers

| Metric                         | Without TDD    | With TDD    |
| ------------------------------ | -------------- | ----------- |
| Lines of unnecessary code      | 30-50% extra   | <5% extra   |
| Time to correct behavior       | 2-3 iterations | 1 iteration |
| Bug rate (post-implementation) | 15-25%         | <5%         |
| Code review iterations         | 3-5 rounds     | 1-2 rounds  |

---

## Quality Gates

After each RED/GREEN/REFACTOR cycle, ALL of these must pass:

```bash
npm test && npm run lint && npm run build
```

If any fail, the cycle is incomplete. Fix before moving to next test.

---

## Forbidden Patterns

| Pattern                            | Why Forbidden                    |
| ---------------------------------- | -------------------------------- |
| `it.skip()`                        | Skipping tests defeats TDD       |
| `// TODO: write test later`        | No test = no implementation      |
| Implementing without test          | Violates core principle          |
| Copy-pasting tests to pass quickly | Tests must reflect real behavior |
| `expect(true).toBe(true)`          | Fake test, no constraint         |
| Writing test after implementation  | That's not TDD                   |

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

## Quick Reference

| Phase    | Action                                      | Must Be                         |
| -------- | ------------------------------------------- | ------------------------------- |
| RED      | Write test                                  | Failing                         |
| GREEN    | Write code                                  | Minimum to pass, no regressions |
| REFACTOR | Clean up                                    | All tests still pass            |
| GATES    | `npm test && npm run lint && npm run build` | All pass                        |
| COMMIT   | Atomic commit                               | One behavior per commit         |

---

_This directive is mandatory for all code generation tasks after type definitions are complete._
