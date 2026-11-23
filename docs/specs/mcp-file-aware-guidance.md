# File-aware MCP lint guidance

## Scope

Improve the read-only orient → lint → edit → recheck loop in the MCP package.
No lint-rule, default-preset, file selection, permission, runtime, or write-tool
changes. Preserve existing inputs, successful report fields, config precedence,
and both file and violation caps. A reader validating a frozen old output schema
may need to refresh it for the additive fields.

## Requirements

- **Coverage.** A lint response reports `coveredFileCount` and
  `uncoveredFileCount` for ESLint-returned files that were linted, based on
  whether their effective flat config enables any `llm-core/*` rule or a
  llm-core finding demonstrates coverage. Ignored and parse-error files stay
  in the existing separate unlinted count. Do not return other plugins'
  violations or enable fallback when a project config exists.
  Uncovered files prompt an actionable text note; they do not imply clean code.
- **Per-file instructions (#450).** Preserve `rules[ruleId].instruction` as the
  default associated with the first violation for compatibility. For a returned
  violation whose effective instruction differs, set `instructionId` pointing
  into an optional shared `instructions` table. Clients prefer that reference
  and otherwise use the rule entry. Store distinct overrides once, only for
  returned violations. All counts include omitted violations.
- **Orientation.** `get_active_instructions({ path })` returns active guidance
  for that existing project-relative file using its own ESLint flat config and
  options (not inline directives). Ignored and unmatched files get a clear
  message. The no-path and explicit-config overview stays available and is
  labeled approximate; combining
  the file and config inputs is an actionable error.
- **Suggestions.** `lint_file({ path, includeSuggestions: true })` includes
  advisory ESLint suggestions for returned violations: exact descriptions,
  zero-based UTF-16 offsets in ESLint's source text (excluding a leading BOM)
  with exclusive ends, and replacement text. Never apply them. Keep at most
  three per violation and twenty per response. Omit rather than truncate any
  suggestion whose description or replacement is over 512 UTF-16 code units.
  Report omitted suggestion counts. Do not include suggested edits by default.
- **Delivery.** A successful lint result's first text block remains the compact
  JSON serialization of its structured content. Server schema and read-only
  annotations describe the resulting contract. Keep the existing human-readable
  error and cap notes.

## Verification

Drive real in-memory MCP client calls. Cover a clean and an uncovered file, a
mixed directory with an unlinted file, both mixed-config file orders and a
capped result, scoped orientation and its no-path overview, and suggestions
with no writes, default omission, and bounded result sizes. Verify text-only
client interpretation by parsing the first text block and resolving the same
references without structured content.
