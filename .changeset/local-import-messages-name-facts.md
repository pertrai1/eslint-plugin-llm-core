---
"eslint-plugin-llm-core": patch
---

`no-hallucinated-local-imports` messages now name the import path and missing binding, and list what does exist: the target module's direct named exports, or the modules in the target directory when the path does not resolve.
