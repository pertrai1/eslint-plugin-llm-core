# llm-core-quality

## 0.1.3

### Patch Changes

- Updated dependencies [a5f621f]
  - eslint-plugin-llm-core@0.36.0

## 0.1.2

### Patch Changes

- bd05468: Improve quality scan output and Knip execution defaults.

  - Hide verbose `llm-core/*` rule details in compact text output while preserving rule IDs and locations.
  - Show actionable Knip finding messages by category, such as unused files and dependencies.
  - Run Knip with `--cache` by default and add an optional `--production` flag for production-only Knip scans.

## 0.1.1

### Patch Changes

- c05f240: Improve terminal output with grouped findings, severity summaries, color controls, compact JSON/SARIF modes, and README documentation.

## 0.1.0

### Minor Changes

- d7148a2: Add the initial quality CLI package skeleton with `scan`, JSON/SARIF reporting, and CI command scaffolding for ESLint and Knip.
