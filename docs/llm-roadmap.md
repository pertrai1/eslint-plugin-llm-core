# MCP Server Implementation Roadmap

Revised plan for the Model Context Protocol server proposed in
[#188](https://github.com/pertrai1/eslint-plugin-llm-core/issues/188).

This revision incorporates review feedback: the server ships as a **sibling
workspace package** (not folded into the plugin entrypoint), the zero-config
fallback is made parser-aware, and the per-diagnostic instruction lookup reuses
the existing pipeline instead of attaching raw templates.

---

## Design Decisions

These were settled during review and govern every phase below.

1. **Sibling workspace package, not `src/mcp/`.** The plugin currently has
   **zero runtime `dependencies`** (`eslint` and `@typescript-eslint/utils` are
   `peerDependencies`). Folding the MCP server in would force the MCP SDK and a
   parser onto everyone who installs the plugin only for its ESLint rules. The
   server lives in `packages/mcp-server/` as its own publishable package that
   depends on `eslint-plugin-llm-core`, the SDK, ESLint, and a TS parser.
2. **MCP package is ESM (`"type": "module"`).** The `@modelcontextprotocol/sdk`
   is ESM. The plugin stays `"type": "commonjs"`; isolating the SDK in an ESM
   package avoids `ERR_REQUIRE_ESM` from a CJS `require()` on Node 20.
3. **The plugin exposes a public instruction-lookup API.** The MCP server must
   not reach into the plugin's internal modules. The plugin's `./instructions`
   subpath gains a `getRuleInstruction()` helper that handles ruleId
   normalization and option-template interpolation (Phase 0).
4. **The zero-config fallback is opt-in and clearly labeled.** A fallback config
   surfaces `recommended` rules a project never opted into, which breaks the
   "same mistake → same message" guarantee relative to the project's own config.
   Fallback-mode results are tagged so agents and users can tell them apart from
   project-config results.

### Open questions — verify before coding

- **SDK module format & API surface.** Confirm against current
  `@modelcontextprotocol/sdk` v1.x docs whether the export is `McpServer` or
  `Server`, and whether registration uses `registerTool`/`registerResource` or
  `setRequestHandler`. The class/method names below are assumed, not verified.
- **Invocation UX trade-off.** A separate package changes the issue's proposed
  `npx -y eslint-plugin-llm-core mcp` to `npx -y eslint-plugin-llm-core-mcp`.
  Confirm the new name (or a scoped alias) before publishing.

---

## Phase 0 — Workspace setup & plugin API prep

Lay the structural and API groundwork the server depends on. Nothing here ships
MCP code yet; it makes the later phases buildable without internal imports.

**Step 1: Convert the repo to npm workspaces**

- Add `"workspaces": ["packages/*"]` to the root `package.json`. The root stays
  the publishable `eslint-plugin-llm-core` package (no dependency changes).
- Create `packages/mcp-server/` (empty package scaffold for Phase 1).

**Step 2: Export a public instruction-lookup API from the plugin**

- Extract the option-template interpolation currently inside
  `src/instructions/config-resolver.ts` into a shared, testable helper.
- Add `getRuleInstruction(ruleName: string, options?: unknown): string | undefined`
  to the `./instructions` subpath export. It must:
  - **Normalize the ruleId** — strip the `llm-core/` prefix so a prefixed
    diagnostic id resolves against the bare-name-keyed `ruleInstructions` map.
  - **Interpolate `optionTemplate`** placeholders against the supplied options,
    reusing the extracted helper (not returning raw `principle` text).
- Update `src/instructions/index.ts` to export `getRuleInstruction` and its
  types.

### Verify

- `npm run build && npm run test && npm run lint` pass at the root.
- Unit tests cover prefix normalization and option interpolation (RED→GREEN).

---

## Phase 1 — MCP package foundation

Stand up the server package, the doc-embedding build step, and its dependencies.

**Step 1: Create `packages/mcp-server/package.json`**

- Name: `eslint-plugin-llm-core-mcp` (pending the naming decision above),
  `"type": "module"`, `"private": false`.
- `dependencies`: `@modelcontextprotocol/sdk` (v1.x), `eslint`,
  `@typescript-eslint/parser`, `zod`, and `eslint-plugin-llm-core`
  (`"workspace:*"`). The parser is required by the Phase 2 fallback — do not
  omit it.
- `bin`: `{ "llm-core-mcp": "./dist/server.js" }`.
- `files`: `["dist"]`.

**Step 2: Create `packages/mcp-server/src/server.ts`**

- Shebang for direct execution.
- Instantiate the SDK server (`McpServer`/`Server` per the verified API),
  metadata name `eslint-plugin-llm-core-mcp`, version read from this package's
  `package.json`.
- Wire `StdioServerTransport` via `server.connect(transport)`.
- Import and register tools/resources from sibling modules (stubs for now).
- Export the server instance for programmatic use.

**Step 3: Create `packages/mcp-server/scripts/embed-rule-docs.ts`**

- Read `docs/rules/*.md` from the repo root (resolve relative to the workspace
  root, since `docs/` is not published with the plugin).
- Generate `packages/mcp-server/src/embedded-docs.ts` exporting a typed
  `Record<string, string>` of rule name → markdown. Embedding makes the docs
  self-contained in this package's `dist`, so `llm-core://rules/{name}` works
  under `npx` even though the plugin omits `docs/` from its published `files`.
- Add `packages/mcp-server/src/embedded-docs.ts` to `.gitignore`.

**Step 4: Build wiring for the MCP package**

- Add `tsx` (or `ts-node`) as a devDependency — the embed script is a `.ts` file.
- Add a `prebuild` script that runs `embed-rule-docs.ts`, **and** trigger it from
  every build entrypoint that runs `tsc` (e.g. `prepare`/`prepublishOnly` and
  CI typecheck), so the gitignored `embedded-docs.ts` always exists before
  compilation.
- Add a `tsconfig.json` for the package targeting ESM output.

### Verify

- `npm run build` in `packages/mcp-server` generates `embedded-docs.ts` then
  compiles cleanly to ESM `dist/`.
- The server starts over stdio and responds to an `initialize` request (manual
  smoke test or the MCP inspector).

---

## Phase 2 — MCP tools

Implement `lint_file` and `get_active_instructions`.

**Step 1: `packages/mcp-server/src/tools/lint-file.ts`**

- Load ESLint with `loadESLint({ useFlatConfig: true })`, mirroring the pattern
  in the plugin's `config-resolver.ts`.
- **Config resolution with a parser-aware fallback:**
  - Attempt local config discovery first (use the project's own config).
  - If none is found, build a transient flat config from
    `plugin.configs.recommended` **plus** `languageOptions: { parser:
tseslintParser }` for TS files. The bare `recommended` config sets no
    parser, so without this `lintFiles(['x.ts'])` fails to parse TypeScript with
    the default espree parser.
  - Tag results produced under the fallback so the response distinguishes
    fallback-mode from project-config mode (per Design Decision 4).
- **Sandbox the path** input to the workspace root before passing it to
  `eslint.lintFiles([path])` — reject paths that escape it.
- Filter results to `llm-core/`-prefixed rule IDs.
- For each violation, call the plugin's `getRuleInstruction(ruleId, options)`
  (Phase 0) to attach the interpolated `instruction`. Do **not** look up the raw
  `ruleInstructions` map directly — that misses on the prefix and skips option
  interpolation.
- Return a JSON array of `{ ruleId, line, column, severity, message,
instruction, source }`, where `source` is `"project"` or `"fallback"`.
- Input schema: `{ path: z.string().describe("File or directory path to lint") }`.

**Step 2: `packages/mcp-server/src/tools/get-active-instructions.ts`**

- Import `generateInstructions` from `eslint-plugin-llm-core/instructions`.
- Input schema: `{ configPath: z.string().optional() }`.
- Call `generateInstructions({ configPath })` and return its `content` markdown
  field (confirmed to exist on `GenerateInstructionsResult`).
- Include rule counts by scope (`allFilesRules` / `javascriptRules` /
  `typescriptRules`) in the response metadata.

### Verify

- Tests cover: project-config path, fallback path on a `.ts` file (parses, no
  parser error), prefix normalization end-to-end, and a configurable rule whose
  `optionTemplate` is interpolated (no literal `{...}` placeholders leak).

---

## Phase 3 — MCP resources & wiring

Implement the `llm-core://rules` listing and `llm-core://rules/{ruleName}` doc
resources, then connect everything.

**Step 1: `packages/mcp-server/src/resources/rules-list.ts`**

- `import plugin from "eslint-plugin-llm-core"` and read `plugin.rules` (for
  `meta.docs.description`) and `plugin.configs` (for category membership).
- Register a static resource at `llm-core://rules` returning
  `{ name, description, hasInstruction, category }` per rule, where `category`
  is derived from which config object (`complexity` / `typescript` /
  `best-practices` / `style` / `hygiene`) lists the rule.
- Include total count and per-category breakdown in response metadata.

**Step 2: `packages/mcp-server/src/resources/rule-doc.ts`**

- Import the generated `embedded-docs.ts`.
- Register a resource template `llm-core://rules/{ruleName}`.
- List callback returns all available rule names for discovery.
- On read, return the embedded markdown; on unknown name, return an informative
  error listing available rules.

**Step 3: Wire `packages/mcp-server/src/server.ts`**

- Register all tools and resources.
- Add `packages/mcp-server/src/index.ts` as a barrel for programmatic access.
- Optionally add an `./` / `./server` entry to the MCP package's `exports` map.

### Verify

- `llm-core://rules` lists every registered rule with a correct category.
- `llm-core://rules/{name}` returns embedded markdown for a known rule and a
  helpful error for an unknown one.
- Full gate at the workspace root: `npm run test && npm run lint && npm run build`.

---

## Done criteria

- `npx -y eslint-plugin-llm-core-mcp` starts a stdio server usable from Claude
  Code / Cursor / Cline.
- The plugin package's dependency posture is unchanged (still zero runtime deps).
- `lint_file` returns interpolated, correctly-attributed instructions for both
  project-config and fallback modes, and parses TypeScript in fallback mode.
- Rule docs resolve from the embedded copy with no reliance on unpublished
  `docs/`.
