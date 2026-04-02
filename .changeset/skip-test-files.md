---
"eslint-plugin-llm-core": minor
---

Add `skipTestFiles` option to `max-function-length` and `no-magic-numbers` rules

Both rules now skip test files (`.test.ts`, `.spec.ts`, etc.) by default, consistent with `max-file-length` behavior.

- **max-function-length**: Test functions are intentionally verbose with setup, mocking, and assertions — self-contained readability matters more than brevity
- **no-magic-numbers**: Magic numbers in tests like `expect(sum(2, 3)).toBe(5)` are readable as-is; extracting to constants hurts clarity

Set `{ skipTestFiles: false }` to enforce these rules in test files.
