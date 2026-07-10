# eslint-plugin-llm-core-mcp

MCP stdio server for just-in-time guidance from `eslint-plugin-llm-core`.

## Installation

Most MCP clients should launch the server with `npx`:

```bash
npx -y eslint-plugin-llm-core-mcp
```

For local development or pinned project usage:

```bash
npm install --save-dev eslint-plugin-llm-core-mcp
npx llm-core-mcp
```

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

## Tools

### `lint_file`

Lints a file or directory inside the project root and returns only
`llm-core/*` violations, each with its teaching guidance attached.

Input:

```json
{
  "path": "src/index.ts"
}
```

Directory targets are capped to prevent broad accidental scans. Narrow the path
when the tool asks for a smaller target.

### `get_active_instructions`

Returns generated lint guidance for the active ESLint config. Call it when an
agent needs project-specific rule guidance without keeping every rule in the
prompt for the full session.

Input:

```json
{}
```

Optional explicit config:

```json
{
  "configPath": "eslint.config.mjs"
}
```

## Resources

- `llm-core://rules` lists rule names, descriptions, categories, and instruction
  availability.
- `llm-core://rules/{ruleName}` returns the embedded markdown documentation for
  one rule, for example `llm-core://rules/no-floating-promise`.

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
npx llm-core-mcp
```

The process waits for MCP JSON-RPC messages on stdin. Stop it with `Ctrl-C`.

For the published package, MCP clients should launch:

```bash
npx -y eslint-plugin-llm-core-mcp
```

## Versioning

`eslint-plugin-llm-core-mcp` has its own package version and depends on a
specific compatible `eslint-plugin-llm-core` version. Changes that affect MCP
behavior and plugin rule metadata together should add changeset entries for both
packages when compatibility depends on releasing them together.
