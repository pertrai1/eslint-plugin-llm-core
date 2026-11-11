---
"eslint-plugin-llm-core": patch
---

Stop `no-type-assertion-any`, `no-any-in-generic`, and `no-type-system-bypass` (explicit `any`) from recommending fixes that other recommended rules flag. Their messages no longer suggest `as unknown as T` or `Record<string, unknown>`, and now say where `unknown` is and is not accepted.
