---
"eslint-plugin-llm-core-mcp": patch
---

Include full violation details in MCP lint_file `structuredContent` so clients
that prefer structured responses over text content see the individual
what/why/how-to-fix messages alongside the violation count.
