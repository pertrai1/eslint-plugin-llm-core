# `lint_file` reports files it could not lint

## Proposal and scope

`lint_file` keeps only messages whose rule id starts with `llm-core/`. ESLint
reports a parse failure and an ignored or unmatched file as a message with no
rule id, so both are dropped and the tool returns `[]`. An agent reads that as
"this file is clean" when no rule ran at all.

The tool should say which files were not linted and why, and should not return
a clean-looking result when nothing was linted.

Scope budget: change only `packages/mcp-server/src/tools/lint-file.ts`, its
tests, the package README, this specification, and a patch changeset. Do not
change the violation shape, the directory cap, config discovery, or fallback
selection.

## Acceptance criteria

- A file with a fatal parse error is reported as unlinted with reason
  `parse-error`, the parser's message, and its line and column.
- A file passed as the target that ESLint skips, because of an ignore pattern or
  because no configuration matches it, is reported as unlinted with reason
  `ignored` and ESLint's message.
- For a directory target, files that ESLint's ignore patterns exclude during
  traversal are not listed. Excluding them is the project's configured intent,
  ESLint returns no result for them, and listing every ignored descendant would
  add unbounded noise to directory results. Parse errors in a directory are
  still reported, because ESLint attempted those files.
- `structuredContent` always carries `unlintedFileCount` and `unlintedFiles`;
  each entry has `filePath` (relative to the project root), `reason`, `message`,
  and `line`/`column` when ESLint provides them.
- When at least one file was linted, the first text block is still the JSON
  violations array, and a second text block lists the unlinted files.
- When no targeted file was linted, the result has `isError: true` and its text
  is the unlinted-file explanation, not `[]`.
- A result with no unlinted files is unchanged apart from the two new
  `structuredContent` fields.
- Other messages without a rule id (for example unused disable directives) are
  not treated as unlinted files.
- Behaviour is the same for `project-config` and `fallback` sources.

## Verification plan

Reproduce with a failing test for a single unparseable file, then add tests for
a mixed directory, an ignore-pattern match, and an unmatched file type. Tests
use temporary directories in fallback mode so no unparseable file is committed
to the repo. Run the MCP package tests, repo lint, and format check.
