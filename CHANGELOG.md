# eslint-plugin-llm-core

## 0.3.0

### Minor Changes

- [`273b82d`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/273b82dc3b1057197364f7d98932566495bae231) Thanks [@pertrai1](https://github.com/pertrai1)! - Add npm provenance for supply chain attestation and documentation improvements

## 0.2.0

### Minor Changes

- [`96929a7`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/96929a77c44bda49eb4528a7512c3df1c5a33084) Thanks [@pertrai1](https://github.com/pertrai1)! - Initial release with 10 rules for LLM code quality:
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
