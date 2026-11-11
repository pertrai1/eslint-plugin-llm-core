---
"eslint-plugin-llm-core": patch
---

`no-async-array-callbacks` now shows only the rewrite for the flagged method (`forEach`, `filter`, `some`, `every`, `reduce`, or `flatMap`) as a true before/after pair, instead of listing every method's recipe on each report.
