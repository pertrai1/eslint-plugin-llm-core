---
"eslint-plugin-llm-core": minor
---

Add `no-incorrect-sort` rule — detects `.sort()` without a compare function, which silently produces incorrect numeric ordering by coercing elements to strings. Framework-agnostic, zero false positives, included in `recommended` and `best-practices` configs.
