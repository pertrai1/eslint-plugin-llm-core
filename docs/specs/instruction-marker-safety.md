# Preserve instruction files with ambiguous reference markers

The `llm-core-instructions` CLI owns only its generated reference block, not
the surrounding hand-written instructions. Appending after a damaged marker can
cause a later run to delete that text. Choosing the first of duplicate markers
can delete it immediately.

- Append the reference only when neither literal marker appears.
- Replace only a single ordered start/end pair on standalone marker lines
  (LF or CRLF), preserving the surrounding content and repeat-run behavior.
- Otherwise leave that instruction file untouched and warn on stderr with its
  path and how to recover. Continue updating other eligible instruction files
  and generating `.agents/linting-rules.md`.
- Do not infer which malformed markers to keep or change file discovery,
  `--no-inject`, `--dry-run`, or the library API.

Prove the contract with repeated CLI runs in a temporary project with both
ambiguous markers and a valid target. Cover lone start/end, duplicates, reversed
markers, inline marker text, and well-formed controls. This is a follow-up to
[#125](https://github.com/pertrai1/eslint-plugin-llm-core/issues/125), not a
provider selection change.
