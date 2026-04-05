---
"eslint-plugin-llm-core": minor
---

Add `no-redundant-logic` rule

Flags four patterns of redundant boolean logic that LLMs commonly generate:

1. **Redundant boolean comparison** — `x === true` → `x`, `x !== true` → `!x`, etc.
2. **Unnecessary else after return/throw** — removes `else` blocks when the `if` always exits
3. **Ternary returning boolean literals** — `cond ? true : false` → `cond`
4. **If/else returning or assigning boolean literals** — `if (c) { return true; } else { return false; }` → `return c;`

All four patterns provide suggestions (not auto-fixes) and are included in `recommended` via `styleRules`.
