---
"eslint-plugin-llm-core": patch
---

Preserve hand-written agent instructions when reference markers are ambiguous.
The instruction generator warns and skips the affected file, while continuing
to generate guidance and update other instruction files.
