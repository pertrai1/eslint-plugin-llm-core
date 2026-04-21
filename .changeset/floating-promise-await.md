---
"eslint-plugin-llm-core": minor
---

Add `no-floating-promise` rule — flags Promise-returning expressions discarded at statement position. Detects three AST-only patterns without requiring TypeScript type information: calls to same-file `async function` references, `Promise.all/allSettled/race/any/resolve/reject` at statement position, and `.then(handler)` chains with fewer than two arguments. Respects `await`, `return`, `void`, variable assignment, `.catch()`, and two-argument `.then()` as handled outcomes. Included in `recommended` and `best-practices` configs.
