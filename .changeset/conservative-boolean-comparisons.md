---
"eslint-plugin-llm-core": patch
---

Preserve strict boolean comparisons for unknown operands and preserve operator precedence when simplifying proven boolean expressions.

Memoize boolean proofs per source file to avoid exponential expansion of shared constant initializers.
