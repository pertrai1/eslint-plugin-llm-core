---
"eslint-plugin-llm-core-mcp": patch
---

`lint_file` no longer returns an empty result for a file it could not lint. Files with a parse error, and files ESLint ignores or has no configuration for, are now listed in `unlintedFiles` with the reason; when nothing was linted the tool returns an error instead of `[]`.
