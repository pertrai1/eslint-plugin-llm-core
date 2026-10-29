---
"eslint-plugin-llm-core": patch
---

Preserve logical OR composition of established Set.has, RegExp.test, and String.endsWith predicates without assuming custom methods return booleans.

Exclude constructor-based boolean proof after explicit global-object mutation or escape, so replaced global constructors cannot produce unsafe strict-comparison suggestions.

Treat destructuring, default/rest, and loop assignment targets conservatively when checking global constructor replacement.

Keep built-in predicate recognition as a nullish-warning suppression heuristic, separate from strict-comparison type proof, and decline recognition after relevant prototype access or constructor exposure.
