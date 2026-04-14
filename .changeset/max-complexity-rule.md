---
"eslint-plugin-llm-core": minor
---

Add `max-complexity` rule — enforce maximum cyclomatic complexity per function with teaching-oriented messages

- Matches ESLint's built-in `complexity` rule (classic variant) counting semantics
- Covers all 13 branching node types: `if`, loops, `catch`, ternary, logical expressions, non-default switch cases, default parameters, logical assignment operators, optional chaining
- Per-function boundary: complexity resets at each code path boundary (functions, class field initializers, static blocks)
- Registered in `complexity` and `recommended` configs
- Replaces ESLint's core `complexity` rule — remove it from your config if you previously used it alongside this plugin
