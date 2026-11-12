---
"eslint-plugin-llm-core-mcp": minor
---

`lint_file` now returns at most 100 violations per call so a large directory cannot produce an unbounded result. `violationCount` is the total found, the new `omittedViolationCount` field says how many were left out, and per-rule counts still cover every violation. When violations are omitted, a text block tells the caller to fix what is shown and lint again, or to narrow the path.
