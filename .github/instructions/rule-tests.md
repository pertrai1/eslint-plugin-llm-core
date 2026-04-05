---
applyTo: "tests/rules/**/*.ts"
---

# Rule Tests

## Test File Pattern

Tests use `RuleTester` from `@typescript-eslint/rule-tester` wired to vitest.

```typescript
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/<rule-name>";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("<rule-name>", rule, {
  valid: [
    // Code strings that should NOT trigger the rule
    `const x = 1;`,
  ],
  invalid: [
    {
      code: `// Code that SHOULD trigger the rule`,
      errors: [{ messageId: "messageIdHere" }],
    },
  ],
});
```

## Test Structure

- **`valid`** array: code snippets that must NOT produce errors
- **`invalid`** array: objects with `code` and expected `errors` (matched by `messageId`)
- For rules with suggestions, include `suggestions` array in the error object
- For rules with options, pass `options` in the test case object

## Test Quality Rules

### No Logic Mirroring

Tests must state expected values directly. Never recompute them with filters, maps, reduces, or conditionals that mirror the rule's implementation.

```typescript
// BAD: recomputes the expected result
const expected = cases.filter((c) => c.shouldFail);

// GOOD: hard-coded expected output
errors: [{ messageId: "noEmptyCatch" }];
```

### Strong Assertions

Verify specific values, not just existence. Avoid `toBeDefined()` or `toBeTruthy()` as primary assertions. In `RuleTester`, this means always asserting on `messageId` (not just `errors: 1`).

### Edge Cases Required

Every rule test suite must cover:

- **Happy path** -- typical valid and invalid code
- **Boundary cases** -- minimum triggering code, code just below the threshold
- **Syntax variations** -- arrow functions vs declarations, destructuring, default params, rest params
- **Non-triggering similar code** -- code that looks like it might trigger but shouldn't

### Hard-Code Expected Output

If the expected value can't be hard-coded, the test is too complex. Break it into smaller cases.

## TDD Reminder

Write the test FIRST. It must FAIL before any implementation. Run `npm run test` to confirm the failure, then implement the minimum code to pass.
