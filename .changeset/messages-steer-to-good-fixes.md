---
"eslint-plugin-llm-core": patch
---

Revise the fix guidance in twelve rule messages so it no longer steers toward a poor fix: `no-unsafe-array-access` leads with a real guard instead of a no-op ternary, `no-inline-disable` no longer offers editing the ESLint config, `no-llm-artifacts` no longer models invented issue numbers, `no-unbounded-promise-all` leads with dependency-free rewrites, `no-swallowed-errors` no longer assumes a vendor, and `no-dynamic-code-execution` dispatches through a `Map`. Smaller wording fixes to `max-complexity`, `no-magic-numbers`, `no-exported-function-expressions`, `no-incorrect-sort`, `prefer-unknown-in-catch`, and `no-redundant-logic`.
