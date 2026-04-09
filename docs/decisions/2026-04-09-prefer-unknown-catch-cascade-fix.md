---
date: 2026-04-09
task: Fix cascading no-type-assertion-any violations caused by prefer-unknown-in-catch fixes
domain: lint-messages
kind: code-convention
scope: cross-cutting
status: active
triggers:
  - editing prefer-unknown-in-catch message
  - editing no-type-assertion-any message
  - adding error-handling rules
  - reviewing eval results showing cascading errors
applies_to:
  - src/rules/prefer-unknown-in-catch.ts
  - src/rules/no-type-assertion-any.ts
  - tests/rules/message-guidance.test.ts
supersedes: []
---

# Add custom property narrowing to prefer-unknown-in-catch to prevent cascading violations

## Context

Eval baseline run (commit e6bdce1, 2026-04-09) on claude-sonnet-4-20250514 showed
`no-type-assertion-any` surviving iteration 1 in three fixtures: error-pipeline,
event-system, and integration-module. The "Diagnostics" section flagged cascading
errors — the LLM's fixes for other rules introduced new violations.

The root cause: when fixing `prefer-unknown-in-catch` (changing `catch (error: any)`
to `catch (error: unknown)`), the LLM needed to access custom error properties like
`.code`. The message showed `instanceof Error` narrowing for `.message`, but not
the pattern for non-standard properties. The LLM fell back to `(error as any).code`,
which triggered `no-type-assertion-any` in the next iteration.

## Decision

Added a "Custom properties" example to the `prefer-unknown-in-catch` message showing
the `'code' in error` narrowing pattern:

```typescript
catch (error: unknown) {
  if (error instanceof Error && 'code' in error && error.code === 503) {
    // 'code' in error narrows to Error & Record<'code', unknown>
  }
}
```

This avoids `as any` entirely by using TypeScript's `in` operator for type narrowing.
The pattern was chosen because it is the smallest local rewrite that satisfies both
`prefer-unknown-in-catch` and `no-type-assertion-any` simultaneously — the LLM does
not need to define helper types or custom type guards.

## Rejected Alternatives

### Add the pattern to no-type-assertion-any instead

Rejected because the cascade originates in the `prefer-unknown-in-catch` fix path.
By the time `no-type-assertion-any` fires (iteration 2), the damage is done. The
guidance belongs at the point where the LLM makes the narrowing decision.

### Show a typed error interface pattern

```typescript
interface ErrorWithCode extends Error {
  code: number;
}
if (error instanceof Error) {
  const typed = error as ErrorWithCode;
}
```

Rejected because it introduces a new type definition — a heavier fix than the `in`
operator pattern. The lint message template convention says to show the smallest
local rewrite.

## Consequences

**Easier:** LLMs fixing `prefer-unknown-in-catch` now have explicit guidance for
custom properties, reducing the chance of cascading `no-type-assertion-any` violations.

**Harder:** The message is longer. The custom property example adds 6 lines. This is
within the template convention but at the upper end.

**Watch for:** Re-run evals after this change lands on main. If error-pipeline,
event-system, and integration-module resolve in 1 iteration instead of 2, the fix
worked. If other fixtures regress, the longer message may be adding noise.
