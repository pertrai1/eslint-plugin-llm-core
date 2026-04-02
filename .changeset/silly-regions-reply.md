---
"eslint-plugin-llm-core": minor
---

Add three new rules to help LLM agents write safer, more idiomatic code:

- `no-async-foreach`: Disallow async callbacks in forEach (promises are silently discarded)
- `no-type-assertion-any`: Disallow `as any` and `<any>` type assertions that bypass type safety
- `no-any-in-generic`: Disallow `any` as a generic type argument (Array<any>, Record<string, any>, etc.)

All three rules are included in the `recommended` config.
