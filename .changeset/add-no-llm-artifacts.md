---
"eslint-plugin-llm-core": minor
---

Add `no-llm-artifacts` rule to detect LLM placeholder comments and stub function bodies

- Detects placeholder comments: `// ... existing code ...`, `// TODO: implement`, `// abbreviated for brevity`, `// continue from here`, `// see above`, and more
- Detects stub functions whose only body is `throw new Error("Not implemented")`
- Added to `recommended` config
