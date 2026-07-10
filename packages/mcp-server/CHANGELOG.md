# eslint-plugin-llm-core-mcp

## 0.29.4

### Patch Changes

- 6f053d8: Build and test the MCP server against the local workspace copy of `eslint-plugin-llm-core`.
- Updated dependencies [6747353]
  - eslint-plugin-llm-core@0.35.1

## 0.29.3

### Patch Changes

- Updated dependencies [f12ba49]
  - eslint-plugin-llm-core@0.35.0

## 0.29.2

### Patch Changes

- Updated dependencies [3042105]
  - eslint-plugin-llm-core@0.34.0

## 0.29.1

### Patch Changes

- Updated dependencies [57ebbed]
  - eslint-plugin-llm-core@0.33.0

## 0.29.0

### Minor Changes

- 54c3202: Add the `no-dynamic-code-execution` rule to catch `eval`, `Function` constructors, and string-based timers with LLM-oriented remediation guidance.

### Patch Changes

- Updated dependencies [54c3202]
  - eslint-plugin-llm-core@0.32.0

## 0.28.0

### Minor Changes

- b9272e1: Add `no-weak-randomness-for-secrets` to catch predictable token, session, reset-code, nonce, salt, API-key, and credential generation.

### Patch Changes

- Updated dependencies [b9272e1]
  - eslint-plugin-llm-core@0.31.0

## 0.27.4

### Patch Changes

- Updated dependencies [f5744b3]
  - eslint-plugin-llm-core@0.30.0

## 0.27.3

### Patch Changes

- Updated dependencies [6089e32]
  - eslint-plugin-llm-core@0.29.0

## 0.27.2

### Patch Changes

- Updated dependencies [87c1131]
  - eslint-plugin-llm-core@0.28.0

## 0.27.1

### Patch Changes

- 5e1069f: Include full violation details in MCP lint_file `structuredContent` so clients
  that prefer structured responses over text content see the individual
  what/why/how-to-fix messages alongside the violation count.

## 0.27.0

### Minor Changes

- 969fb47: Add opt-in MCP server zero-config fallback mode via `LLM_CORE_MCP_ENABLE_FALLBACK=1`, with explicit project-config versus fallback source labeling.

### Patch Changes

- Updated dependencies [969fb47]
  - eslint-plugin-llm-core@0.27.0

## 0.26.0

### Minor Changes

- [#200](https://github.com/pertrai1/eslint-plugin-llm-core/pull/200) [`30be45d`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/30be45df92999c9381df98cc607208e2cb55706b) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Add the `no-async-promise-executor` rule.

### Patch Changes

- Updated dependencies [[`30be45d`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/30be45df92999c9381df98cc607208e2cb55706b)]:
  - eslint-plugin-llm-core@0.26.0

## 0.25.2

### Patch Changes

- [#194](https://github.com/pertrai1/eslint-plugin-llm-core/pull/194) [`2214c3b`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/2214c3b1f3f680283895c93a5a85d27a6e64ce4d) Thanks [@pertrai1](https://github.com/pertrai1)! - Add MCP package repository metadata required for npm provenance validation.

- Updated dependencies [[`2214c3b`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/2214c3b1f3f680283895c93a5a85d27a6e64ce4d)]:
  - eslint-plugin-llm-core@0.25.2

## 0.25.1

### Patch Changes

- [#192](https://github.com/pertrai1/eslint-plugin-llm-core/pull/192) [`497bc6e`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/497bc6e03ca725cf034272092cf768189ab67ea5) Thanks [@pertrai1](https://github.com/pertrai1)! - Fix MCP package publishing metadata and configure the release workflow to provide npm authentication for package publishing.

- Updated dependencies [[`497bc6e`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/497bc6e03ca725cf034272092cf768189ab67ea5)]:
  - eslint-plugin-llm-core@0.25.1

## 0.25.0

### Minor Changes

- [#190](https://github.com/pertrai1/eslint-plugin-llm-core/pull/190) [`0059efb`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/0059efb8f97fbab7734cafdf85bf92014c49f9e2) Thanks [@pertrai1](https://github.com/pertrai1)! - Finalize MCP server wiring, package documentation, bin setup guidance, and
  lockstep release metadata.

### Patch Changes

- Updated dependencies [[`0059efb`](https://github.com/pertrai1/eslint-plugin-llm-core/commit/0059efb8f97fbab7734cafdf85bf92014c49f9e2)]:
  - eslint-plugin-llm-core@0.25.0
