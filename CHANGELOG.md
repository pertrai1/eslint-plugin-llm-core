# eslint-plugin-llm-core

## 0.5.0

### Minor Changes

- [`95c32d4`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/95c32d49ee844d3a69213ebf73e446c5d6bb2f8a) Thanks [@pertrai1](https://github.com/pertrai1)! - Add new async/error handling rules and fix max-nesting-depth bug

  **New rules:**
  - `no-async-array-callbacks` - Disallow async callbacks in array methods where Promises are silently discarded (replaces `no-async-foreach` with broader coverage for `filter`, `some`, `every`, `reduce`, `flatMap`)
  - `throw-error-objects` - Disallow throwing non-Error values (strings, objects, arrays)
  - `no-empty-catch` - Disallow catch blocks with no meaningful error handling
  - `prefer-unknown-in-catch` - Disallow `catch (e: any)`, prefer `unknown` with type narrowing

  **Bug fixes:**
  - `max-nesting-depth` now correctly resets depth at function boundaries (previously depth leaked across nested functions)

  **Breaking changes:**
  - `no-async-foreach` has been replaced by `no-async-array-callbacks` (covers more array methods)

## 0.4.1

### Patch Changes

- [`53bc467`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/53bc46737c0e259f95ed48d3ab4f2ee40717c3e2) Thanks [@pertrai1](https://github.com/pertrai1)! - Tighten eslint peer dependency to `^8.57.0 || ^9.0.0 || ^10.0.0` for explicit ESLint 10 support

## 0.4.0

### Minor Changes

- [`9ba108b`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/9ba108bb02283f41816d5d1ebbeae84e9d30b862) Thanks [@pertrai1](https://github.com/pertrai1)! - Add three new rules to help LLM agents write safer, more idiomatic code:
  - `no-async-foreach`: Disallow async callbacks in forEach (promises are silently discarded)
  - `no-type-assertion-any`: Disallow `as any` and `<any>` type assertions that bypass type safety
  - `no-any-in-generic`: Disallow `any` as a generic type argument (Array<any>, Record<string, any>, etc.)

  All three rules are included in the `recommended` config.

## 0.3.1

### Patch Changes

- [`b3be7e1`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/b3be7e1394a1aa039e6d5f8304c4c56ded67a38a) Thanks [@pertrai1](https://github.com/pertrai1)! - fix esm export for flat config

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
