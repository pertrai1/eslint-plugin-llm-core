---
"eslint-plugin-llm-core": patch
---

Preserve strict boolean comparisons for unknown operands and preserve operator precedence when simplifying proven boolean expressions.

Memoize boolean proofs per source file to avoid exponential expansion of shared constant initializers. Preserve strict comparisons on all method calls, whose return types cannot be guaranteed from syntax.
