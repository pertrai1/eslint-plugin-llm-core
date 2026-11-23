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
findings are labeled with `source: "project-config"`. Launch the stdio server
from the project root (set the working directory in your client if needed),
then use paths relative to that root.

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

Result (`structuredContent`, also sent as compact JSON in the first text block):

```json
{
  "source": "project-config",
  "violationCount": 1,
  "violations": [
    {
      "filePath": "src/index.ts",
      "line": 3,
      "column": 5,
      "ruleId": "llm-core/no-empty-catch",
      "severity": 2,
      "message": "Empty catch block silently swallows errors — choose an explicit outcome.",
      "guidanceId": "llm-core/no-empty-catch#1"
    }
  ],
  "rules": {
    "llm-core/no-empty-catch": {
      "count": 1,
      "instruction": "Never leave catch blocks empty — handle, rethrow, or log the error"
    }
  },
  "guidance": {
    "llm-core/no-empty-catch#1": "Why: …\n\nHow to fix: …"
  },
  "omittedViolationCount": 0,
  "coveredFileCount": 1,
  "uncoveredFileCount": 0,
  "unlintedFileCount": 0,
  "unlintedFiles": []
}
```

Text that repeats is sent once. Each violation carries its file, location and
the first paragraph of the rule message. The rest of the message, the why and
how-to-fix text, is in `guidance` under the violation's `guidanceId`; violations
with identical text share an entry, and violations whose text differs get their
own. `rules` holds each rule's total count and its first one-line instruction.
When a file’s options produce a different instruction, its violation has an
`instructionId`. Prefer `instructions[violation.instructionId]` when present;
otherwise use `rules[violation.ruleId].instruction`. Identical overrides share
one entry, and the optional table only contains entries referenced by returned
violations.

One call returns at most 100 violations, in ESLint's order. `violationCount` is
the total found and `omittedViolationCount` is how many were left out;
`rules[ruleId].count` still counts every violation. When some are omitted, a
second text block says so. Fix what is shown and lint again, or narrow the path
to reach the rest.

The tool declares this shape as its output schema and is annotated read-only.
Clients that validate against a saved copy of the old schema should refresh it
from `tools/list` before reading the new fields.

Use `coveredFileCount` and `uncoveredFileCount` before interpreting a zero count.
Coverage means a linted file had llm-core rules enabled in its effective flat
config or produced a llm-core diagnostic. Uncovered files were linted by ESLint
but had no llm-core coverage; a zero llm-core violation count does not make
those files clean. Neither count includes files reported as unlinted. Other
ESLint rules' diagnostics are not returned.

For exact advisory edits, pass `{ "path": "src/index.ts", "includeSuggestions": true }`.
When ESLint supplies suggestions, a violation may contain `suggestions` with
`desc` and `fix: { range, text }`. Ranges are zero-based UTF-16 offsets; the end
is exclusive. Ranges use ESLint’s source text, which excludes a leading BOM.
The tool never applies any edit. Review a suggestion and apply it
only if the file still matches the linted version, then call `lint_file` again on
the edited file. There are at most three suggestions per violation and twenty
per response. An edit with a description or replacement longer than 512 UTF-16
code units is omitted, never truncated; `omittedSuggestionCount` records omitted
suggestions for that violation. Suggestions are off by default.

Directory targets are capped to prevent broad accidental scans. When a directory
is over the cap, or no ESLint config is found and fallback is off, the tool
returns an error result explaining what to do instead of a lint result.

Files that could not be linted are reported rather than treated as clean. A file
with a parse error, or one ESLint ignores or has no configuration for, appears in
`structuredContent.unlintedFiles` with a `reason` of `parse-error` or `ignored`,
and is listed in a second text block after the result. When none of the
targeted files could be linted, the tool returns an error describing why instead
of an empty result.

`ignored` applies to the path you pass. When the target is a directory, files
that the project's ignore patterns exclude are skipped as ESLint normally does
and are not listed; lint such a file directly to see why it is skipped.

### `get_active_instructions`

Use a project-relative file path when you need the rules and options that
actually apply to a file:

```json
{
  "path": "src/index.ts"
}
```

The file must exist within the project root. Ignored or unmatched files do
not have file-specific guidance. This lookup uses the project's config, not
the fallback lint preset or inline rule comments.

Omit `path` for an approximate overview based on representative files at the
project root. Directory-specific overrides may not be represented:

```json
{}
```

For the overview only, you can optionally select a config file. Do not pass
`configPath` together with `path`.

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
