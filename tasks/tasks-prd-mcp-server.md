# Tasks: MCP Server for Just-In-Time Linting Guidance

## 1. Source PRD

- **PRD:** [`tasks/prd-mcp-server.md`](./prd-mcp-server.md)
- **Feature slug:** `mcp-server`
- **Roadmap:** [`docs/llm-roadmap.md`](../docs/llm-roadmap.md) (Phase 0–3)
- **Issue:** [#188](https://github.com/pertrai1/eslint-plugin-llm-core/issues/188)

## 2. Summary

Build `eslint-plugin-llm-core-mcp`, a sibling ESM workspace package that exposes
the plugin's existing rule guidance to AI coding agents over the MCP `stdio`
transport. v1 ships two tools (`lint_file`, `get_active_instructions`) and two
resources (`llm-core://rules`, `llm-core://rules/{ruleName}`). `lint_file` lints
with the project's own ESLint config and attaches each rule's "what / why /
how-to-fix" instruction to its diagnostic. The core plugin's runtime dependency
posture is left unchanged. Sequenced **foundation-first**; tests are **unit +
integration** (tools/resources driven over an in-memory MCP transport).

## 3. Assumptions

These were chosen where the PRD did not fully specify, and govern the sub-tasks:

- **A1 — Directory cap default (FR-13).** `lint_file` warns when a directory
  target expands to more than **200 files** (configurable). This is a starting
  value to be validated and tuned by the benchmark sub-task (3.7); it is not a
  hard product requirement.
- **A2 — Integration test mechanism.** Tool/resource integration tests use the
  SDK's in-memory transport (`InMemoryTransport.createLinkedPair()`) to connect a
  client and the server in-process — no spawned process (per chosen test depth).
- **A3 — Success-metric instrumentation (PRD Open Q #2).** Defining the
  baseline and measurement harness for the §8 metrics is a discovery sub-task
  (7.5), not a v1 implementation blocker.
- **A4 — Package name & SDK API are settled** per the PRD: name
  `eslint-plugin-llm-core-mcp`; `@modelcontextprotocol/sdk@^1.29.0` high-level
  API (`McpServer`, `registerTool`/`registerResource`/`ResourceTemplate`,
  `StdioServerTransport`).
- **A5 — Lockstep versioning.** The MCP package releases in lockstep with the
  core plugin via the existing Changesets flow.

## 4. High-Level Tasks

| #   | Task                                                  | PRD mapping             | Estimate |
| --- | ----------------------------------------------------- | ----------------------- | -------- |
| 1   | Workspace setup + plugin public instruction API       | FR-1, FR-2, FR-23       | Medium   |
| 2   | MCP package scaffold: transport + doc-embedding build | FR-1, FR-3, FR-4, FR-21 | Medium   |
| 3   | `lint_file` tool                                      | FR-5–FR-13              | Large    |
| 4   | `get_active_instructions` tool                        | FR-14–FR-16             | Small    |
| 5   | Rule resources (`llm-core://rules` + `…/{ruleName}`)  | FR-17–FR-22             | Medium   |
| 6   | Server wiring, packaging/bin finalization + docs      | FR-3, FR-4, §7 release  | Medium   |
| 7   | CI / workspace build + test integration               | Goals 1–4               | Medium   |

Tasks 1 → 2 are prerequisites for everything else. 3, 4, 5 can proceed in
parallel once 2 lands. 6 depends on 3–5; 7 depends on all.

---

## 5. Sub-Tasks, Acceptance Criteria, Dependencies & Estimates

### Task 1 — Workspace setup + plugin public instruction API

- **PRD mapping:** FR-1, FR-2, FR-23; §7 (workspace, public API addition)
- **Estimate:** Medium
- **Dependencies:** `src/instructions/config-resolver.ts` (option interpolation),
  `src/instructions/rule-instructions.ts` (`ruleInstructions`), `src/instructions/index.ts`
- **Acceptance criteria:**
  - Given the root `package.json` declares `workspaces: ["packages/*"]`, when
    `npm install` runs at the root, then `packages/*` are linked and the existing
    plugin `build` / `test` / `lint` still pass.
  - Given a prefixed rule id `llm-core/no-empty-catch`, when `getRuleInstruction`
    is called, then it returns the same instruction as the bare name
    `no-empty-catch`.
  - Given a rule whose instruction has an `optionTemplate`, when called with that
    rule's options, then placeholders are interpolated and no literal `{…}`
    tokens remain.
  - Given an unknown rule name, then `getRuleInstruction` returns `undefined`.
  - The core plugin's `dependencies` field remains empty (zero runtime deps).
- **Sub-tasks:**
  1.1. Add `workspaces: ["packages/*"]` to root `package.json`; create the
  `packages/mcp-server/` directory placeholder.
  1.2. Extract the option-template interpolation from `config-resolver.ts` into a
  shared exported helper; refactor `config-resolver.ts` to use it (no
  behavior change — existing tests stay green).
  1.3. (RED) Write failing unit tests for `getRuleInstruction`: prefix
  normalization, option interpolation, and unknown-rule cases.
  1.4. (GREEN) Implement `getRuleInstruction(ruleName, options?)` and export it
  (plus types) from `src/instructions/index.ts`.
  1.5. Run root gates (`npm run build && npm test && npm run lint`); confirm
  `dependencies` unchanged.

### Task 2 — MCP package scaffold: transport + doc-embedding build

- **PRD mapping:** FR-1, FR-3, FR-4, FR-21; §7 (module format, SDK pin, embedding)
- **Estimate:** Medium
- **Dependencies:** Task 1; `@modelcontextprotocol/sdk@^1.29.0`; `docs/rules/*.md`
- **Acceptance criteria:**
  - `packages/mcp-server/package.json` exists with: name
    `eslint-plugin-llm-core-mcp`, `"type": "module"`, `bin.llm-core-mcp`,
    `files: ["dist"]`, and dependencies on the SDK (`^1.29.0`), `eslint`,
    `@typescript-eslint/parser`, `zod`, and `eslint-plugin-llm-core`
    (`workspace:*`).
  - Given the embed script runs, then `src/embedded-docs.ts` is generated mapping
    each rule name → its `docs/rules/*.md` content, the generated file is
    gitignored, and it is produced before every `tsc` invocation (`prebuild` +
    `prepare`/`prepublishOnly`).
  - Given `npm run build` in the package, then `embedded-docs.ts` is generated and
    the package compiles to ESM `dist/`.
  - Given an MCP client connected over the in-memory transport, then an
    `initialize` request succeeds.
- **Sub-tasks:**
  2.1. Create `packages/mcp-server/package.json` (name, `type: module`, bin,
  deps, files) and an ESM `tsconfig.json`.
  2.2. Add `tsx` devDependency; add `scripts/embed-rule-docs.ts` (reads repo-root
  `docs/rules/*.md` → writes `src/embedded-docs.ts`); wire `prebuild` +
  `prepare`/`prepublishOnly` to run it; gitignore the generated file.
  2.3. Create `src/server.ts`: instantiate `McpServer`
  (`@modelcontextprotocol/sdk/server/mcp.js`) with name/version, set up
  `StdioServerTransport` and `await server.connect(transport)`; leave
  tool/resource registration as stubs.
  2.4. (Integration RED→GREEN) Add a test using
  `InMemoryTransport.createLinkedPair()` that connects a client and asserts
  `initialize` succeeds.
  2.5. Verify `npm run build` emits ESM `dist/` and that `embedded-docs.ts`
  exists beforehand.

### Task 3 — `lint_file` tool

- **PRD mapping:** FR-5–FR-13
- **Estimate:** Large
- **Dependencies:** Task 1 (`getRuleInstruction`), Task 2 (scaffold); `eslint`
  `loadESLint`; `@typescript-eslint/parser`
- **Acceptance criteria:**
  - Given a fixture project with `eslint-plugin-llm-core` configured and a file
    that violates an `llm-core` rule, when `lint_file` runs on that file, then it
    returns a JSON array where each violation has `ruleId`, `line`, `column`,
    `severity`, `message`, and an `instruction` matching `getRuleInstruction`
    (prefix stripped, options interpolated).
  - Non-`llm-core/` diagnostics are excluded from the result.
  - Given a target with no discoverable ESLint config, then the tool returns a
    clear "install & configure" message (not an empty array) and does **not**
    spin up a fallback config.
  - Given a `path` resolving outside the project root, then the call is rejected.
  - Given a directory exceeding the configured max-file cap (A1), then a warning
    asks the caller to narrow the path; within the cap, it lints normally.
- **Sub-tasks:**
  3.1. (RED) Integration test with a fixture project + a file violating e.g.
  `no-empty-catch`; expect a violation with the attached instruction.
  3.2. (GREEN) Implement `src/tools/lint-file.ts`: `loadESLint({ useFlatConfig:
true })`, discover the project config, `eslint.lintFiles([path])`, map
  results to the filtered structured array.
  3.3. Attach guidance via `getRuleInstruction(ruleId, options)`; add a test for
  a configurable rule whose `optionTemplate` must interpolate (no `{…}`
  leaks).
  3.4. No-config path: detect absence of a discoverable config and return the
  actionable message (test).
  3.5. Path sandboxing: resolve and validate `path` within the project root;
  reject escapes (test).
  3.6. Directory guard (FR-13): count target files; warn when above the
  configurable cap (default per A1); make the cap configurable (test both
  below and above the cap).
  3.7. (Discovery) Benchmark ESLint programmatic linting across file counts to
  validate/tune the A1 default; record the finding and adjust the default if
  warranted. (PRD Open Q #1)
  3.8. Register the tool via `server.registerTool` with a Zod `inputSchema`
  `{ path }`.

### Task 4 — `get_active_instructions` tool

- **PRD mapping:** FR-14–FR-16
- **Estimate:** Small
- **Dependencies:** Task 1/2; plugin `generateInstructions` (`content` field)
- **Acceptance criteria:**
  - Given a call (optionally with `configPath`), then the tool returns the
    markdown from `generateInstructions({ configPath })` and includes rule counts
    by scope (all-files / JavaScript-only / TypeScript-only) in metadata.
- **Sub-tasks:**
  4.1. (RED) Integration test: call the tool, assert non-empty markdown content
  and that scope counts are present.
  4.2. (GREEN) Implement `src/tools/get-active-instructions.ts`: import
  `generateInstructions` from `eslint-plugin-llm-core/instructions`; return
  `content` + scope-count metadata; Zod schema `{ configPath?: string }`.
  4.3. Register the tool.

### Task 5 — Rule resources

- **PRD mapping:** FR-17–FR-22
- **Estimate:** Medium
- **Dependencies:** Task 2 (`embedded-docs`); plugin default export
  (`plugin.rules`, `plugin.configs`); `getRuleInstruction`/`ruleInstructions`
- **Acceptance criteria:**
  - `llm-core://rules` returns an entry `{ name, description, hasInstruction,
category }` per registered rule, plus a total count and per-category
    breakdown; `category` is derived from which `plugin.configs` group lists the
    rule.
  - `llm-core://rules/{ruleName}` returns the embedded markdown for a known rule;
    an unknown name returns an informative error listing available rule names; the
    template's list callback enumerates all rule names.
- **Sub-tasks:**
  5.1. (RED) Integration tests: listing returns all rules with categories; the
  doc template returns markdown for a known rule and an error for an unknown
  one.
  5.2. (GREEN) `src/resources/rules-list.ts`: read `plugin.rules` + `plugin.configs`;
  build entries, derive category, add counts; register static resource.
  5.3. (GREEN) `src/resources/rule-doc.ts`: register a `ResourceTemplate` at
  `llm-core://rules/{ruleName}` with a list callback; read from
  `embedded-docs`; handle unknown names.
  5.4. Register both resources.

### Task 6 — Server wiring, packaging/bin finalization + consumer docs

- **PRD mapping:** FR-3, FR-4; §7 (versioning/Changesets); consumer setup docs
- **Estimate:** Medium
- **Dependencies:** Tasks 3–5 registered
- **Acceptance criteria:**
  - Given the assembled server, when a client lists capabilities over the
    in-memory transport, then it sees both tools (`lint_file`,
    `get_active_instructions`) and both resources (`llm-core://rules` + the
    template).
  - The built `dist/server.js` has a shebang and is wired to the `llm-core-mcp`
    bin; `npx -y eslint-plugin-llm-core-mcp` starts a stdio server (documented
    manual smoke check).
  - Consumer docs include an `mcpServers` config snippet (`command: npx`, `args:
["-y", "eslint-plugin-llm-core-mcp"]`).
  - A changeset is added and the lockstep versioning note (A5) is documented.
- **Sub-tasks:**
  6.1. Wire all tool/resource registrations into `src/server.ts`; add
  `src/index.ts` barrel exporting the server for programmatic use.
  6.2. Integration test: client enumerates the two tools and two resources.
  6.3. Confirm the bin entry: shebang present, `dist/server.js` executable;
  document the `npx` smoke-test steps.
  6.4. Add an MCP setup section (package README + root docs) with the
  `mcpServers` JSON snippet and zero-config caveat (project must have ESLint
  configured in v1).
  6.5. Add a changeset; document lockstep versioning under the existing flow.

### Task 7 — CI / workspace build + test integration

- **PRD mapping:** Goals 1–4; quality gates
- **Estimate:** Medium
- **Dependencies:** Tasks 1–6; existing GitHub Actions (Node 20/22)
- **Acceptance criteria:**
  - CI builds and tests both workspace packages on Node 20 and 22; the MCP
    package's `prebuild` (doc embedding) runs in CI; the ESM package starts on
    Node 20 (no `ERR_REQUIRE_ESM`).
  - Root `build` / `test` / `lint` / `format:check` cover `packages/**` (or a
    documented workspace-aware invocation exists).
- **Sub-tasks:**
  7.1. Update root scripts to run across workspaces (or add workspace-aware
  scripts) for build/test/lint/format.
  7.2. Update GitHub Actions to build + test the workspace; explicitly verify the
  ESM MCP package runs on Node 20.
  7.3. Ensure Prettier/ESLint config covers `packages/mcp-server/**`;
  `format:check` passes.
  7.4. Confirm the Changesets/release flow handles the new package (lockstep).
  7.5. (Discovery) Define the measurement method for the §8 success metrics — the
  static-injection token baseline and how first-attempt self-correction is
  observed (benchmark harness vs. telemetry). (PRD Open Q #2)

---

## 6. Dependencies (consolidated)

- **Internal:** `src/instructions/*` (interpolation helper, `ruleInstructions`,
  `generateInstructions`, new `getRuleInstruction`); plugin default export
  (`rules`, `configs`); `docs/rules/*.md`.
- **External:** `@modelcontextprotocol/sdk@^1.29.0`, `eslint`,
  `@typescript-eslint/parser`, `zod`; `tsx` (dev, embed script).
- **Decisions (settled):** package name, lockstep versioning, SDK high-level API
  (see Assumptions A4/A5).

## 7. Out of Scope

- **Zero-config global fallback** (PRD Non-Goal #1 / Future Work — v2).
- **Auto-fixing**, **file/config mutation**, a **second lint engine**, and a
  **general-purpose assistant** (PRD Non-Goals #2–#5).
- **Streamable HTTP / SSE transports** — v1 is `stdio` only.
- **Independent versioning** of the MCP package (lockstep for now).
- **End-to-end process-spawning tests** — not in the chosen test depth (unit +
  in-memory integration only).
