# `lint_file` result shape: file paths, shared guidance, declared schema

## Proposal and scope

Three problems with the current `lint_file` result:

- A violation has no file path, so a directory result does not say which file
  each violation is in.
- Every violation repeats the rule's full what/why/how message and its
  instruction. Linting 96 third-party source files in fallback mode returned 917
  violations in 833 KB of text. Of 29 rules that fired, 21 used exactly one
  why/how text for all of their violations.
- The tool declares no annotations and no output schema, although it is
  read-only and already returns `structuredContent`.

Change the result so each violation names its file, repeated text is sent once,
and the shape is declared.

Scope budget: `packages/mcp-server/src/tools/lint-file.ts`, its tests, the
package README, this specification, and a minor changeset. Do not change which
files are linted, the directory cap, config discovery, fallback selection, the
unlinted-file reporting, or `get_active_instructions`. A cap on the number of
violations returned is not part of this change.

## Result shape

`structuredContent` for a completed lint:

```json
{
  "source": "project-config",
  "violationCount": 2,
  "violations": [
    {
      "filePath": "src/a.ts",
      "line": 3,
      "column": 5,
      "ruleId": "llm-core/no-empty-catch",
      "severity": 2,
      "message": "Empty catch block silently swallows errors.",
      "guidanceId": "llm-core/no-empty-catch#1"
    }
  ],
  "rules": {
    "llm-core/no-empty-catch": {
      "count": 2,
      "instruction": "Never leave catch blocks empty — handle, rethrow, or log the error"
    }
  },
  "guidance": {
    "llm-core/no-empty-catch#1": "Why: …\n\nHow to fix: …"
  },
  "unlintedFileCount": 0,
  "unlintedFiles": []
}
```

## Acceptance criteria

- Each violation has `filePath`, relative to the project root.
- A rule message is split at its first blank line. The first paragraph is the
  violation's `message`. The remainder is stored once in `guidance` under an id
  of the form `<ruleId>#<n>`, numbered from 1 in order of first appearance, and
  the violation refers to it by `guidanceId`.
- Violations of one rule whose remainder text is identical share one guidance
  entry. Violations whose remainder differs get their own entry, so no message
  text is lost.
- A message with no blank line is kept whole in `message`, with no `guidanceId`.
- `rules` has one entry per rule that fired, with its violation `count` and its
  `instruction` when the rule has one. Violations no longer carry `instruction`
  or `source`; `source` stays at the top level.
- The first text block is the compact JSON serialization of `structuredContent`,
  not a bare violations array.
- The tool declares an `outputSchema` matching this shape and the annotations
  `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`,
  `openWorldHint: false`.
- The two results that return guidance text instead of a lint result — no ESLint
  config found, and a directory over the file cap — are marked `isError: true`.
  A declared output schema requires every non-error result to carry
  `structuredContent`, and in both cases the requested lint did not happen.
- Unlinted-file reporting is unchanged: the second text block and the
  nothing-linted error behave as specified in `mcp-lint-file-unlinted-files.md`.

## Known limitation

`rules[ruleId].instruction` is interpolated with the options of the first file
in which the rule fired. If one directory lint spans files that configure the
same rule with different options, later files' violations cite an instruction
built from the first file's options. The rule message itself is unaffected.

## Measured result

The 96-file sample from the proposal returns the same 917 violations in 310 KB
of text, down from 833 KB (163 guidance entries for 29 rules).

## Compatibility

This changes what existing consumers receive: the text block is an object
rather than an array, `instruction` and the why/how text move out of each
violation, and two informational results become errors. It ships as a minor
version of `eslint-plugin-llm-core-mcp`.

## Verification plan

Write failing tests for the file path, shared and distinct guidance, the rules
table, the text block, the declared schema and annotations, and the two error
results; then implement. Re-measure the 96-file sample and record the size.
Run the MCP package tests, build, lint on changed files, and format check.
