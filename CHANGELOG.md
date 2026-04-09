# eslint-plugin-llm-core

## 0.11.2

### Patch Changes

- [#105](https://github.com/pertrai1/eslint-plugin-llm-core/pull/105) [`8994099`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/899409977e75b7f1d69b2626d133733893fefa00) Thanks [@pertrai1](https://github.com/pertrai1)! - Add custom property narrowing example to prefer-unknown-in-catch message to prevent cascading no-type-assertion-any violations

## 0.11.1

### Patch Changes

- [#85](https://github.com/pertrai1/eslint-plugin-llm-core/pull/85) [`65289c7`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/65289c77c815a0a8b61cd40004d59477bca49f2d) Thanks [@pertrai1](https://github.com/pertrai1)! - Fix rule conflict between `explicit-export-types` and `@typescript-eslint/no-inferrable-types`. Parameters with primitive literal defaults (`= 0`, `= "hello"`, `= true`, `= null`, `= -1`, `= 0n`) are no longer flagged as missing type annotations, since TypeScript infers the type deterministically from the literal value.

## 0.11.0

### Minor Changes

- [#79](https://github.com/pertrai1/eslint-plugin-llm-core/pull/79) [`0999854`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/0999854f7c40eee577b1fd8427ebc9a9611f4b41) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Add `no-redundant-logic` rule

  Flags four patterns of redundant boolean logic that LLMs commonly generate:
  1. **Redundant boolean comparison** — `x === true` → `x`, `x !== true` → `!x`, etc.
  2. **Unnecessary else after return/throw** — removes `else` blocks when the `if` always exits
  3. **Ternary returning boolean literals** — `cond ? true : false` → `cond`
  4. **If/else returning or assigning boolean literals** — `if (c) { return true; } else { return false; }` → `return c;`

  All four patterns provide suggestions (not auto-fixes) and are included in `recommended` via `styleRules`.

## 0.10.0

### Minor Changes

- [#73](https://github.com/pertrai1/eslint-plugin-llm-core/pull/73) [`b1bf4d6`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/b1bf4d63bf4f8cbdaff1104fc61f21adb9d2a2e1) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Add `consistent-catch-param-name` rule to enforce consistent naming for catch clause parameters (default: `"error"`). LLMs frequently mix naming conventions (`e`, `err`, `error`, `ex`) in the same codebase.

## 0.9.0

### Minor Changes

- [`8dbca9f`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/8dbca9f61a14f8a32f497fab1c6f05ab060c3e23) Thanks [@pertrai1](https://github.com/pertrai1)! - Add granular rule configurations for mix-and-match usage
  - New configs: `best-practices`, `error-prevention`, `maintainability`, `type-safety` (plus identifier-safe aliases like `bestPractices`)
  - Extract file glob constants and compose `recommendedRules` from category objects
  - Users can now pick individual rule categories instead of using `recommended` as a monolith

## 0.8.0

### Minor Changes

- [#69](https://github.com/pertrai1/eslint-plugin-llm-core/pull/69) [`f235b3e`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/f235b3e50564421f0b6faa04df53e9939e825b7f) Thanks [@pertrai1](https://github.com/pertrai1)! - Add `no-llm-artifacts` rule to detect LLM placeholder comments and stub function bodies
  - Detects placeholder comments: `// ... existing code ...`, `// TODO: implement`, `// abbreviated for brevity`, `// continue from here`, `// see above`, and more
  - Detects stub functions whose only body is `throw new Error("Not implemented")`
  - Added to `recommended` config

## 0.7.2

### Patch Changes

- [`c715ff6`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/c715ff6e528a4693deae0d536cff5fb6eaae3ccf) Thanks [@pertrai1](https://github.com/pertrai1)! - Bug fixes for `no-async-array-callbacks` and `no-magic-numbers`

  **no-async-array-callbacks:**
  - Recognize `Promise.race` and `Promise.any` as safe consumers of async map results
  - Handle deferred `Promise.all` pattern where the map result is stored in a `const` variable and consumed later (`const p = items.map(async ...); await Promise.all(p)`)

  **no-magic-numbers:**
  - Refactor `isConstAssignment` traversal for clarity (separate tracking variable instead of parameter reassignment)
  - Fix regression where TypeScript assertion wrappers (`as const`, `satisfies`, `!`, `<type>`) in const declarations were falsely flagged as magic numbers

## 0.7.1

### Patch Changes

- [`cbc1c34`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/cbc1c3421eed59a2b1796245dbc215cdf607a935) Thanks [@pertrai1](https://github.com/pertrai1)! - Fix incorrect GitHub URL in create-rule.ts

  Rule documentation URLs pointed to `rsimpson2/eslint-plugin-llm-core` instead of `pertrai1/eslint-plugin-llm-core`, causing all rule doc links to 404 in IDEs and ESLint output.

## 0.7.0

### Minor Changes

- Add `explicit-export-types` rule

  Requires explicit parameter and return type annotations on all exported functions (declarations, arrow functions, function expressions, default exports). Non-exported functions are not flagged.

  The rule is enabled in `recommended` for TypeScript files only (`.ts`/`.tsx`), since it accesses TypeScript-specific AST nodes that are not present in plain JavaScript.

  This enforces type-first development at the module boundary: agents must define type contracts before implementing exported functions.

## 0.6.0

### Minor Changes

- [`ec7186f`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/ec7186f0bf050277e1f32073aa13452ad4174210) Thanks [@pertrai1](https://github.com/pertrai1)! - Add `skipTestFiles` option to `max-function-length` and `no-magic-numbers` rules

  Both rules now skip test files (`.test.ts`, `.spec.ts`, etc.) by default, consistent with `max-file-length` behavior.
  - **max-function-length**: Test functions are intentionally verbose with setup, mocking, and assertions — self-contained readability matters more than brevity
  - **no-magic-numbers**: Magic numbers in tests like `expect(sum(2, 3)).toBe(5)` are readable as-is; extracting to constants hurts clarity

  Set `{ skipTestFiles: false }` to enforce these rules in test files.

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
