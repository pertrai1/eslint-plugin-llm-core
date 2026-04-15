# Common Errors & Solutions

Last Updated: 2026-04-15
Total Errors Documented: 1 (1 retired)

---

## Error: Missing await on async rule test helpers (RETIRED)

**Retired**: 2026-04-15
**Automated by**: `@typescript-eslint/no-floating-promises` enabled in eslint.config.ts

**Frequency**: 3 occurrences | **Severity**: Medium | **Last Occurrence**: 2026-03-10

**Symptom**: Rule test passes locally but `RuleTester` reports unexpected Promise; test result is silently ignored.

**Bad Pattern**: `ruleTester.run("my-rule", rule, { valid: [...], invalid: [...] })`

**Correct Pattern**: `ruleTester.run("my-rule", rule, { valid: [...], invalid: [...] })` (with `@typescript-eslint/no-floating-promises` catching missing `await` at lint time)

**Prevention**: Enabled `@typescript-eslint/no-floating-promises` rule — CI now catches this automatically.

---
