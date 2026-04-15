---
"eslint-plugin-llm-core": minor
---

Add automatic injection of linting-rules.md references into agent instruction files

After generating `.agents/linting-rules.md`, the CLI now appends a reference block
into any existing instruction files (AGENTS.md, CLAUDE.md, .github/copilot-instructions.md).
Re-running replaces the block in-place — no duplicates. Use `--no-inject` to skip injection.
