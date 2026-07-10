# eslint-plugin-llm-core

Monorepo for `eslint-plugin-llm-core` and companion tooling.

## Packages

- [`packages/eslint-plugin`](packages/eslint-plugin) — the published `eslint-plugin-llm-core` package.
- [`packages/mcp-server`](packages/mcp-server) — the published `eslint-plugin-llm-core-mcp` package.
- [`packages/quality-cli`](packages/quality-cli) — the published `llm-core-quality` CLI for running ESLint and Knip quality checks with text, JSON, or SARIF output.

## Quality CLI

Use `llm-core-quality` when you want one command that runs the repo's quality engines and emits agent-friendly or CI-friendly reports.

```bash
# Human-readable grouped terminal report
llm-core-quality scan

# Pretty JSON / SARIF for inspection
llm-core-quality scan --json
llm-core-quality scan --sarif

# Compact machine output for scripts
# Use --compact with JSON/SARIF output; shorthand examples include scan --compact.
llm-core-quality scan --json --compact
llm-core-quality scan --sarif --compact

# CI mode fails when findings are present
llm-core-quality ci
```

The text reporter groups findings by relative path, summarizes severities, and auto-detects color support. Use `--color` to force ANSI colors or `--no-color` to disable them.

## Development

```bash
npm ci
npm run build
npm run lint
npm run format:check
npm run test:coverage
```

Package-specific commands can be run with npm workspaces, for example:

```bash
npm --workspace eslint-plugin-llm-core test
npm --workspace eslint-plugin-llm-core-mcp test
npm --workspace llm-core-quality test
```
