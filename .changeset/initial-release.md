---
"eslint-plugin-llm-core": minor
---

Initial release with 10 rules for LLM code quality:

- `no-exported-function-expressions` — Enforce function declarations over arrow/expression exports
- `filename-match-export` — Enforce filenames match their single export name
- `structured-logging` — Enforce static log messages with structured metadata
- `max-nesting-depth` — Limit control flow nesting depth
- `no-inline-disable` — Disallow eslint-disable comments
- `max-params` — Limit function parameters, encourage object params
- `max-function-length` — Limit function length, encourage decomposition
- `max-file-length` — Limit file length, encourage module separation
- `no-magic-numbers` — Enforce named constants
- `naming-conventions` — Enforce Base prefix and Error suffix conventions

Includes `recommended` and `all` preset configs.
