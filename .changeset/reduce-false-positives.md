---
"eslint-plugin-llm-core": minor
---

Add options to reduce false positives in `no-magic-numbers`, `filename-match-export`, and `max-params`

- **no-magic-numbers**: New `ignoreObjectProperties` option (default: `false`) skips numbers used as object literal property values. Fixes data files like pricing tables and HTTP status maps being flagged as magic numbers.
- **filename-match-export**: Case-insensitive fallback for kebab-case filenames. Fixes false positives when export names contain acronyms (e.g., `bedrock-kb-rag-tool.ts` exporting `BedrockKBRagTool`).
- **max-params**: New `maxInternal` option (default: same as `max`) applies a relaxed limit to non-exported functions. Fixes internal helpers like `handleError(error, message, context)` being flagged when `max: 2` is too strict for private functions.
