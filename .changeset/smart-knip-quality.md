---
"llm-core-quality": patch
---

Improve quality scan output and Knip execution defaults.

- Hide verbose `llm-core/*` rule details in compact text output while preserving rule IDs and locations.
- Show actionable Knip finding messages by category, such as unused files and dependencies.
- Run Knip with `--cache` by default and add an optional `--production` flag for production-only Knip scans.
