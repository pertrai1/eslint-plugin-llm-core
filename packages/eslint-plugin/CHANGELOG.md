# eslint-plugin-llm-core

## 0.37.0

### Minor Changes

- 9fd29dd: Add `no-chained-type-assertions` to reject assertion chains that discard type evidence.
- 2a8c304: Add `no-known-value-widening` to reject broad annotations that discard concrete initializer evidence.
- 36d529e: Add `no-object-parameters` to require named input contracts instead of broad `object` parameters.
- 34251a1: Add `no-unknown-parameters` to require decoded domain inputs at function boundaries.
- 7e2f600: Add `no-unknown-returns` to require decoded domain types in function contracts.
- 8e2fbf7: Add `no-unknown-type-aliases` to keep undecoded boundary values visibly typed as `unknown`.
- a76ebc7: Add `no-unsafe-dictionary-type` to require concrete dictionary value contracts.

## 0.36.2

### Patch Changes

- b42bb1e: Update typescript-eslint dependencies and the plugin utils peer minimum to 8.69.0.

## 0.36.1

### Patch Changes

- bce1d45: Update the TypeScript ESLint utilities peer dependency and MCP parser dependency to 8.68.0.

## 0.36.0

### Minor Changes

- a5f621f: Add `no-widen-then-assert` to flag variables declared with a wider `T | undefined`/`T | null` type than their known value, then forced back to the narrow type with an assertion.

## 0.35.1

### Patch Changes

- 6747353: Move the plugin package into the workspace package directory without changing its public exports or CLI entrypoint.
