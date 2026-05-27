# PRD: MCP Server for Just-In-Time Linting Guidance

**Status:** Draft (clarifying questions resolved)
**Source issue:** [#188](https://github.com/pertrai1/eslint-plugin-llm-core/issues/188)
**Implementation roadmap:** [`docs/llm-roadmap.md`](../docs/llm-roadmap.md)

---

## 1. Introduction / Overview

`eslint-plugin-llm-core` already gives AI coding agents deterministic, teachable
feedback in two ways: as a standard ESLint plugin, and as a static instructions
file (via the `llm-core-instructions` CLI) that gets pasted into steering files
like `AGENTS.md` or `.cursorrules`.

The static approach has a cost: keeping all 33 rules in the agent's prompt on
**every turn** consumes a large, fixed slice of the token budget even when the
agent is writing valid code.

This feature adds a **Model Context Protocol (MCP) server** — a separate package
named `eslint-plugin-llm-core-mcp` — that delivers the same guidance
**reactively**. The agent starts with no rule instructions in its prompt. When
it edits a file, the agent (or an editor hook) calls the server, which lints the
file using the project's own ESLint configuration and returns each violation
**with its specific "what / why / how-to-fix" instruction attached**. Guidance is
paid for only when a violation actually occurs.

**Problem solved:** eliminate the per-turn token cost of static rule injection
while preserving the plugin's deterministic, self-correcting feedback.

---

## 2. Goals

1. Cut the prompt tokens an agent spends on lint guidance by serving instructions
   only when a violation occurs, instead of injecting all rules every turn.
2. Preserve the plugin's determinism: a given violation produces the same
   instruction every time, sourced from the existing instruction pipeline.
3. Reuse the project's existing ESLint configuration so the server's findings
   match what `npm run lint` would report — no second, divergent rule set.
4. Ship as a standalone package that any MCP-capable editor can run, without
   adding any runtime dependency to the core ESLint plugin.

---

## 3. User Stories

- **As an AI coding agent**, I want to lint a file I just edited and receive each
  violation together with its fix instruction, so I can correct the mistake on my
  next turn without the rules being permanently loaded in my prompt.
- **As an AI coding agent**, I want to fetch the full active rule guidance once at
  the start of a session, so I can orient myself without keeping it loaded every
  turn.
- **As an AI coding agent**, when I don't understand why a rule fired, I want to
  read that rule's full documentation on demand, so I can resolve the violation
  correctly.
- **As a developer using Claude Code / Cursor / Cline**, I want to register one
  MCP server and have my agent receive `llm-core` guidance automatically, so I
  don't have to maintain a pasted instructions block in every repo.

---

## 4. Functional Requirements

### Packaging & distribution

1. The server MUST ship as a separate package named `eslint-plugin-llm-core-mcp`,
   located at `packages/mcp-server/` in an npm-workspaces layout.
2. The core `eslint-plugin-llm-core` package's runtime dependencies MUST remain
   unchanged (zero runtime `dependencies`; `eslint` and `@typescript-eslint/utils`
   stay as `peerDependencies`).
3. The MCP package MUST be runnable via `npx -y eslint-plugin-llm-core-mcp` and
   expose a `llm-core-mcp` bin entry.
4. The server MUST communicate over the MCP `stdio` transport.

### Tool: `lint_file`

5. The server MUST expose a `lint_file` tool accepting a single input
   `path` (string) — a file or directory.
6. `lint_file` MUST lint the target using the **project's own discovered ESLint
   configuration** (flat config).
7. If no ESLint configuration can be discovered for the target path, `lint_file`
   MUST return a clear, actionable message telling the user to install and
   configure `eslint-plugin-llm-core` in their project. It MUST NOT silently
   return zero violations, and (in v1) MUST NOT fall back to a built-in config
   (see Non-Goals).
8. `lint_file` MUST return results as a structured JSON array, free of terminal
   ANSI formatting.
9. Results MUST be filtered to violations whose rule ID is prefixed `llm-core/`.
10. For each returned violation, the server MUST attach an `instruction` field
    containing that rule's "what / why / how-to-fix" guidance. The rule ID MUST be
    normalized (the `llm-core/` prefix stripped) before the instruction is looked
    up, and any option-template placeholders in the instruction MUST be
    interpolated against the options that rule fired with.
11. Each violation object MUST include at least: `ruleId`, `line`, `column`,
    `severity`, `message`, and `instruction`.
12. The `path` input MUST be validated against the working directory so the tool
    cannot be pointed at files outside the project root.
13. When `path` is a directory, the server MUST guard against unbounded work: it
    MUST enforce a configurable maximum file count and, when the target exceeds
    it, return a warning that asks the caller to narrow the path rather than
    silently linting an entire large codebase. (The default threshold is to be
    validated — see Open Questions.)

### Tool: `get_active_instructions`

Included in v1 to support agent orientation at the start of a session. It is
partially redundant with reactive `lint_file` guidance; its continued inclusion
will be revisited based on usage feedback after release.

14. The server MUST expose a `get_active_instructions` tool accepting an optional
    `configPath` (string).
15. The tool MUST return the full active rule guidance as a single markdown
    string, produced by the existing instruction generator.
16. The response MUST include rule counts broken down by scope (all-files,
    JavaScript-only, TypeScript-only).

### Resource: rule listing

17. The server MUST expose an MCP resource at `llm-core://rules` listing every
    registered rule.
18. Each listed rule MUST include its `name`, a `description`, whether it has an
    attached instruction (`hasInstruction`), and its `category` (one of
    `complexity`, `typescript`, `best-practices`, `style`, `hygiene`).
19. The listing response MUST include a total count and a per-category breakdown.

### Resource: rule documentation

20. The server MUST expose an MCP resource template (via `ResourceTemplate`) at
    `llm-core://rules/{ruleName}` that returns the full markdown documentation for
    a single rule.
21. Rule documentation MUST be embedded into the MCP package at build time so it
    resolves correctly when installed via `npx` (the core plugin does not publish
    its `docs/` directory).
22. A request for an unknown rule name MUST return an informative error that lists
    the available rule names.

### Determinism & reuse

23. The server MUST source all guidance from the plugin's existing instruction
    pipeline via a public API; it MUST NOT duplicate or reimplement rule
    instructions, and MUST NOT reach into the plugin's internal modules.

---

## 5. Non-Goals (Out of Scope for v1)

1. **Zero-config global fallback.** v1 does NOT spin up a transient ESLint
   instance for repos with no ESLint config; `lint_file` operates only on a
   project's discovered configuration. This **is planned for a future release
   (v2)** — see Future Work.
2. **A second lint engine or policy system.** The server runs the project's
   existing ESLint config; it does not invent its own rule set or configuration
   model.
3. **Writing files or mutating repo configuration.** The server is read-only with
   respect to the user's project; it returns guidance and never edits files.
4. **A general-purpose coding assistant.** Scope is limited to `llm-core` rule
   guidance and documentation.
5. **Auto-fixing violations.** Consistent with the plugin's philosophy, the server
   returns suggestions/instructions, not applied fixes.

---

## 6. Design Considerations

- Guidance attached to a violation uses the existing "what / why / how-to-fix"
  message format, so feedback delivered via MCP reads identically to feedback
  delivered via the ESLint plugin or the static instructions file.
- The rule listing's `category` values mirror the plugin's published config
  groupings so agents see a consistent taxonomy across surfaces.

---

## 7. Technical Considerations

- **Workspace layout.** The repo adopts npm workspaces (`packages/*`). The root
  remains the publishable `eslint-plugin-llm-core` package; the server lives in
  `packages/mcp-server/`.
- **Module format.** The MCP package is ESM (`"type": "module"`) because
  `@modelcontextprotocol/sdk` is ESM; the core plugin stays CommonJS. This avoids
  a CommonJS `require()` of an ESM-only module (`ERR_REQUIRE_ESM`) on Node 20.
- **MCP SDK version & API (confirmed).** Pin `@modelcontextprotocol/sdk` to
  `^1.29.0`. Use the high-level API, verified against the v1.x docs:
  - `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`.
  - Tools via `server.registerTool(name, { title, description, inputSchema },
handler)` with `inputSchema` defined as a Zod shape.
  - Static resources via `server.registerResource(...)`; the templated rule-doc
    resource via `ResourceTemplate` (with a list callback for discovery).
  - `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`,
    connected via `await server.connect(transport)`.
- **Dependencies.** The MCP package depends on `@modelcontextprotocol/sdk`
  (`^1.29.0`), `eslint`, `@typescript-eslint/parser` (required to parse
  TypeScript files), the `eslint-plugin-llm-core` workspace package, and `zod`
  for tool input schemas.
- **Public API addition.** The core plugin's `./instructions` subpath must expose
  a `getRuleInstruction(ruleName, options?)` helper (ruleId normalization +
  option-template interpolation) so the server attaches guidance without
  duplicating logic. `generateInstructions` already returns a `content` markdown
  field for `get_active_instructions`.
- **Doc embedding.** A build step generates an embedded copy of `docs/rules/*.md`
  inside the MCP package so rule docs ship in its `dist`.
- **Versioning / release.** The MCP package versions **in lockstep** with the
  core plugin under the existing Changesets flow, keeping the two compatible and
  the release process simple. Independent versioning may be revisited later if a
  need arises.
- Full implementation sequencing lives in
  [`docs/llm-roadmap.md`](../docs/llm-roadmap.md) (Phase 0–3).

---

## 8. Success Metrics

1. **Token reduction:** measurable reduction in prompt tokens spent on lint
   guidance per agent session compared with static instruction injection (target:
   guidance tokens scale with the number of violations, not with the rule count ×
   turns).
2. **First-attempt self-correction rate:** the share of `llm-core` violations an
   agent resolves on its next turn after receiving the inline `instruction`,
   without the violation recurring.

---

## 9. Future Work (post-v1)

- **Zero-config global fallback (v2).** Add an opt-in fallback so `lint_file`
  works in repos with no ESLint config by spinning up a transient ESLint instance
  configured with `eslint-plugin-llm-core`. This requires a bundled parser and
  clear labeling so fallback findings are distinguishable from project-config
  findings — fallback may surface rules the project never opted into, which breaks
  determinism relative to the project's own config. Tracked as a deliberate v2
  expansion, not a v1 gap.

---

## 10. Open Questions

1. **Directory-lint threshold (FR-13).** What default maximum file count balances
   usefulness against latency in an interactive agent loop? Needs research into
   ESLint programmatic-API performance on large trees and a benchmark before a
   default is fixed; the limit should be configurable regardless.
2. **Success-metric instrumentation.** How are the §8 metrics actually measured —
   what defines the static-injection baseline for token reduction, and how is
   "first-attempt self-correction" observed (e.g., a benchmark harness vs.
   field telemetry)? Required before either metric can be reported.
