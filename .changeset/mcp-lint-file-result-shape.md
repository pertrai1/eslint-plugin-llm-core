---
"eslint-plugin-llm-core-mcp": minor
---

`lint_file` results now name the file of each violation and send repeated text once. Each violation carries `filePath`, its location and the first paragraph of the rule message; the why/how-to-fix text moves to a shared `guidance` table referenced by `guidanceId`, and each rule's violation count and instruction move to `rules`. The first text block is the whole result as compact JSON rather than a violations array. The tool now declares an output schema and read-only annotations, and the no-config and over-the-file-cap responses are returned as error results.
