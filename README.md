# eslint-plugin-llm-core

Monorepo for `eslint-plugin-llm-core` and companion tooling for applying the
same rule guidance through ESLint, MCP, and quality-gate workflows.

## Packages

| Package                                            | Published name               | Use it when                                                                  |
| -------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| [`packages/eslint-plugin`](packages/eslint-plugin) | `eslint-plugin-llm-core`     | You want ESLint rules and generated agent instructions in a project.         |
| [`packages/mcp-server`](packages/mcp-server)       | `eslint-plugin-llm-core-mcp` | You want an MCP-capable agent to request just-in-time lint guidance.         |
| [`packages/quality-cli`](packages/quality-cli)     | `llm-core-quality`           | You want one CLI that runs ESLint and Knip with text, JSON, or SARIF output. |

The ESLint plugin is the core package. The MCP server and quality CLI depend on
it so they can reuse the same rule metadata, generated instructions, and lint
messages.

```text
eslint-plugin-llm-core
├─ eslint-plugin-llm-core-mcp  MCP tools and rule resources
└─ llm-core-quality            ESLint + Knip quality gate
```

## Install What You Need

For normal ESLint usage:

```bash
npm install --save-dev eslint eslint-plugin-llm-core
```

For MCP client registration:

```json
{
  "mcpServers": {
    "llm-core": {
      "command": "npx",
      "args": ["-y", "eslint-plugin-llm-core-mcp"]
    }
  }
}
```

For local or CI quality scans:

```bash
npx llm-core-quality scan
npx llm-core-quality ci --sarif
```

## Development

```bash
npm ci
npm run build
npm run lint
npm run format:check
npm run test:coverage
```

Package-specific commands can be run with npm workspaces:

```bash
npm --workspace eslint-plugin-llm-core test
npm --workspace eslint-plugin-llm-core-mcp test
npm --workspace llm-core-quality test
```

Common workspace commands:

| Command                      | Scope                         |
| ---------------------------- | ----------------------------- |
| `npm run build`              | Build all published packages. |
| `npm run test`               | Test all published packages.  |
| `npm run test:core`          | Test only the ESLint plugin.  |
| `npm run lint`               | Lint the full workspace.      |
| `npm run format:check`       | Check formatting.             |
| `npm run update:eslint-docs` | Regenerate plugin rule docs.  |

## Documentation Map

- [ESLint plugin README](packages/eslint-plugin) - rule setup, configs, rule
  catalog, generated instructions, and companion package overview.
- [MCP server README](packages/mcp-server) - MCP client setup, tools,
  resources, and fallback mode.
- [Quality CLI README](packages/quality-cli) - scan/CI commands, reporters,
  engines, and exit-code behavior.
- [Contributing guide](CONTRIBUTING.md) - monorepo development workflow and rule
  contribution steps.
- [Decision records](docs/decisions) - durable project and workflow decisions.

## Versioning

This repository uses Changesets. Packages are published independently, but some
changes require coordinated releases:

- Rule metadata or generated-instruction changes usually affect
  `eslint-plugin-llm-core`.
- MCP behavior that depends on current rule metadata may require changesets for
  both `eslint-plugin-llm-core` and `eslint-plugin-llm-core-mcp`.
- Quality CLI changes usually affect only `llm-core-quality` unless they depend
  on a new plugin capability.
