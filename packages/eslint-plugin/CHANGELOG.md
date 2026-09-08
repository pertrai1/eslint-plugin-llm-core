# eslint-plugin-llm-core

## 0.36.1

### Patch Changes

- bce1d45: Update the TypeScript ESLint utilities peer dependency and MCP parser dependency to 8.68.0.

## 0.36.0

### Minor Changes

- a5f621f: Add `no-widen-then-assert` to flag variables declared with a wider `T | undefined`/`T | null` type than their known value, then forced back to the narrow type with an assertion.

## 0.35.1

### Patch Changes

- 6747353: Move the plugin package into the workspace package directory without changing its public exports or CLI entrypoint.
