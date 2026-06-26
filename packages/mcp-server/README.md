# eslint-plugin-llm-core-mcp

MCP stdio server for just-in-time guidance from `eslint-plugin-llm-core`.

The server exposes:

- `lint_file`: lints a file or directory with the target project's own ESLint
  flat config and returns `llm-core/*` violations with their guidance attached.
- `get_active_instructions`: returns the active generated guidance markdown.
- `llm-core://rules`: lists registered rules, descriptions, categories, and
  instruction availability.
- `llm-core://rules/{ruleName}`: returns embedded markdown documentation for one
  rule.

## MCP Client Setup

Register the server with an MCP-capable client using `npx`:

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

`lint_file` first uses the project ESLint configuration it discovers from the
target path. Project configuration always takes precedence, and project-config
findings are labeled with `source: "project-config"`.

## Optional Zero-Config Fallback

Repos without an ESLint config can opt in to a transient fallback config:

```json
{
  "mcpServers": {
    "llm-core": {
      "command": "npx",
      "args": ["-y", "eslint-plugin-llm-core-mcp"],
      "env": {
        "LLM_CORE_MCP_ENABLE_FALLBACK": "1"
      }
    }
  }
}
```

Fallback mode only runs when no project ESLint config is discoverable. It uses
the bundled `eslint-plugin-llm-core` recommended config and TypeScript parser,
returns findings labeled with `source: "fallback"`, and remains read-only: it
does not write files, create config files, enable autofix, or create an ESLint
cache.

Tradeoff: fallback findings may include rules the target project has not opted
into. Install and configure `eslint-plugin-llm-core` in the project when you need
findings to match CI/editor lint exactly.

## Manual Smoke Check

After building the package, confirm the stdio server starts:

```bash
npm --workspace eslint-plugin-llm-core-mcp run build
node packages/mcp-server/dist/server.js
```

The process waits for MCP JSON-RPC messages on stdin. Stop it with `Ctrl-C`.

For the published package, MCP clients should launch:

```bash
npx -y eslint-plugin-llm-core-mcp
```

## Versioning

`eslint-plugin-llm-core-mcp` versions in lockstep with
`eslint-plugin-llm-core` under the existing Changesets release flow. Changes
that affect either package should add a changeset entry for both packages when
compatibility depends on matching versions.
