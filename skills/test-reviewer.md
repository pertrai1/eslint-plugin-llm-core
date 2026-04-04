---
name: "test-reviewer"
description: "Use this skill when writing or reviewing tests. Detects tests that duplicate production logic, use shallow assertions, skip edge cases, or assert on mocks instead of behavior."
---

# Test Reviewer

You are a specialist in writing and reviewing tests. Your primary focus is ensuring tests assert observable behavior rather than reimplementing the logic they're supposed to verify. This file is meant to grow — add good patterns here as the team discovers them.

## Core Principle: Don't Duplicate Production Logic

A test should _state_ what the outcome is, not _recompute_ it. If the test contains logic that mirrors the implementation, it's not testing anything — it's just running the code twice.

---

## What to Flag

### Rule 1: No Implementation Mirroring

Flag any test that derives its expected values using the same logic as the implementation. Treat the following constructs in test code as suspicious when they mirror production code:

- Filters, maps, and reduces
- Conditionals and branching logic
- Loops and iterations
- String concatenation or template logic that rebuilds output

```typescript
// ❌ BAD: Test mirrors the production logic
function getActiveUsers(users: User[]): User[] {
  return users.filter((u) => u.isActive && !u.isDeleted);
}

it("should return active users", () => {
  const users = [
    { id: "1", isActive: true, isDeleted: false },
    { id: "2", isActive: false, isDeleted: false },
    { id: "3", isActive: true, isDeleted: true },
  ];
  const expected = users.filter((u) => u.isActive && !u.isDeleted);
  expect(getActiveUsers(users)).toEqual(expected);
});

// ✅ GOOD: Test asserts on concrete expected output
it("should return only users that are active and not deleted", () => {
  const users = [
    { id: "1", isActive: true, isDeleted: false },
    { id: "2", isActive: false, isDeleted: false },
    { id: "3", isActive: true, isDeleted: true },
  ];
  expect(getActiveUsers(users)).toEqual([
    { id: "1", isActive: true, isDeleted: false },
  ]);
});
```

**How to fix:** Hard-code the expected output. If you can't hard-code it, the test is too complex — break it into smaller cases.

### Rule 2: Strong Assertions

Every assertion must verify a specific, meaningful value. Weak assertions pass even when the code is broken.

```typescript
// ❌ BAD: Asserts existence, not correctness
it("should create a user", async () => {
  const user = await createUser({ name: "Alice", email: "alice@test.com" });
  expect(user).toBeDefined();
  expect(user.id).toBeTruthy();
});

// ✅ GOOD: Asserts specific values and structure
it("should create a user with the provided details", async () => {
  const user = await createUser({ name: "Alice", email: "alice@test.com" });
  expect(user).toEqual({
    id: expect.any(String),
    name: "Alice",
    email: "alice@test.com",
    createdAt: expect.any(Date),
  });
});
```

**Weak assertions to flag:**

| Assertion                       | Problem                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| `toBeDefined()`                 | Passes for any non-undefined value, including wrong values  |
| `toBeTruthy()`                  | Passes for `1`, `"wrong"`, `{}`, `[]` — almost anything     |
| `toBeFalsy()`                   | Passes for `0`, `""`, `null`, `undefined` — too many things |
| `expect(result).not.toBeNull()` | Confirms existence, not correctness                         |

**Negated assertions** are a related smell — they constrain what a value _isn't_ without saying what it _is_:

```typescript
// ❌ BAD: Says what it's not — passes for any other value, including wrong ones
expect(input).not.toHaveValue("old value");
expect(element).not.toBeVisible();
expect(list).not.toHaveLength(0);
expect(button).not.toBeDisabled();

// ✅ GOOD: Says what it is — only one correct value passes
expect(input).toHaveValue("new value");
expect(element).toBeHidden();
expect(list).toHaveLength(3);
expect(button).toBeEnabled();
```

**Acceptable uses of negated assertions:**

- Verifying absence: `expect(element).not.toBeInTheDocument()` (there is no positive form)
- As _additional_ verification alongside a positive assertion

**Acceptable uses of weak assertions:**

- As guards before stronger ones: `expect(result).toBeDefined(); expect(result.name).toBe("Alice");`
- When testing a boolean function that should return `true`

### Rule 3: Edge Cases Required

Every test suite must include at least one test for each category:

1. **Empty input** — empty string, empty array, empty object
2. **Null/undefined** — missing or absent values
3. **Boundary values** — zero, negative numbers, max length, single element
4. **Error cases** — invalid input, network failure, timeout

```typescript
// ❌ BAD: Only tests the happy path
describe("parseConfig", () => {
  it("should parse valid config", () => {
    expect(parseConfig('{"port": 3000}')).toEqual({ port: 3000 });
  });
});

// ✅ GOOD: Covers happy path + edge cases
describe("parseConfig", () => {
  it("should parse valid config", () => {
    expect(parseConfig('{"port": 3000}')).toEqual({ port: 3000 });
  });

  it("should throw on empty string", () => {
    expect(() => parseConfig("")).toThrow();
  });

  it("should throw on invalid JSON", () => {
    expect(() => parseConfig("not json")).toThrow(ConfigParseError);
  });

  it("should return defaults for empty object", () => {
    expect(parseConfig("{}")).toEqual({ port: 8080 });
  });
});
```

### Rule 4: Behavior Over Mocks

Assert on what the system _did_, not on what mocks were _called with_. Mock assertions test your test setup, not your code.

```typescript
// ❌ BAD: Only asserts on mock calls
it("should send welcome email", async () => {
  const mockMailer = { send: vi.fn() };
  await registerUser({ name: "Alice", email: "alice@test.com" }, mockMailer);
  expect(mockMailer.send).toHaveBeenCalledWith({
    to: "alice@test.com",
    subject: "Welcome",
  });
});

// ✅ GOOD: Asserts on the actual outcome
it("should register user and send welcome email", async () => {
  const sent: Email[] = [];
  const mailer = { send: (email: Email) => sent.push(email) };

  const user = await registerUser(
    { name: "Alice", email: "alice@test.com" },
    mailer,
  );

  expect(user).toEqual({
    id: expect.any(String),
    name: "Alice",
    email: "alice@test.com",
  });
  expect(sent).toEqual([
    { to: "alice@test.com", subject: "Welcome", body: expect.any(String) },
  ]);
});
```

**When mock assertions are acceptable:**

- Verifying a side effect with no observable return value (logging, metrics)
- Verifying a dependency was _not_ called (negative test)
- As _additional_ verification alongside behavioral assertions

**When mock assertions are a smell:**

- `expect(mock).toHaveBeenCalledWith(...)` with no `expect(result)...` in the same test
- Mock setup is longer than the assertion block
- Changing the implementation (not the behavior) would break the test

---

## Review Process

For every test you write or review:

1. **Identify the behavior under test** — what outcome or side effect is this test meant to verify?
2. **Check for logic mirroring** — does the test derive the expected value using logic instead of stating it directly?
3. **Check assertion strength** — does every assertion verify a specific value, not just existence?
4. **Check edge case coverage** — are empty, null, boundary, and error cases represented?
5. **Check mock usage** — do assertions target outcomes, or just mock call signatures?
6. **If any rule is violated** — flag it using the output format below.

---

## Output Format for Flagged Tests

When flagging a test, use this structure:

```
### [Rule violated]: [Brief description]

**File:** `path/to/test.ts`
**Test:** "should [test name]"
**Problem:** [What is wrong and why it matters]

**Current:**
\`\`\`typescript
[the problematic test code]
\`\`\`

**Suggested:**
\`\`\`typescript
[the corrected test code]
\`\`\`
```
