---
"eslint-plugin-llm-core": minor
---

Add granular rule configurations for mix-and-match usage

- New configs: `best-practices`, `error-prevention`, `maintainability`, `type-safety` (plus identifier-safe aliases like `bestPractices`)
- Extract file glob constants and compose `recommendedRules` from category objects
- Users can now pick individual rule categories instead of using `recommended` as a monolith
