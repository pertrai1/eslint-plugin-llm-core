# eslint-plugin-llm-core

Monorepo for `eslint-plugin-llm-core` and companion tooling.

## Packages

- [`packages/eslint-plugin`](packages/eslint-plugin) — the published `eslint-plugin-llm-core` package.
- [`packages/mcp-server`](packages/mcp-server) — the published `eslint-plugin-llm-core-mcp` package.

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
```
