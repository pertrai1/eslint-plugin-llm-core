---
"eslint-plugin-llm-core": minor
---

Add `no-incorrect-sort` rule — detects `.sort()` without a compare function, which silently produces incorrect numeric ordering by coercing elements to strings. Framework-agnostic, included in `all` and `best-practices` configs.
