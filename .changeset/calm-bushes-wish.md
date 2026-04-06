---
"eslint-plugin-llm-core": patch
---

Fix rule conflict between `explicit-export-types` and `@typescript-eslint/no-inferrable-types`. Parameters with primitive literal defaults (`= 0`, `= "hello"`, `= true`, `= null`, `= -1`, `= 0n`) are no longer flagged as missing type annotations, since TypeScript infers the type deterministically from the literal value.
