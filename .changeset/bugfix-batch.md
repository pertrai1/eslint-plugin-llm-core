---
"eslint-plugin-llm-core": patch
---

Bug fixes for `no-async-array-callbacks` and `no-magic-numbers`

**no-async-array-callbacks:**

- Recognize `Promise.race` and `Promise.any` as safe consumers of async map results
- Handle deferred `Promise.all` pattern where the map result is stored in a `const` variable and consumed later (`const p = items.map(async ...); await Promise.all(p)`)

**no-magic-numbers:**

- Refactor `isConstAssignment` traversal for clarity (separate tracking variable instead of parameter reassignment)
- Fix regression where TypeScript assertion wrappers (`as const`, `satisfies`, `!`, `<type>`) in const declarations were falsely flagged as magic numbers
