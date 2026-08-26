---
"eslint-plugin-llm-core": minor
---

Add `no-widen-then-assert` to flag variables declared with a wider `T | undefined`/`T | null` type than their known value, then forced back to the narrow type with an assertion.
