# eslint-plugin-llm-core

## 0.37.7

### Patch Changes

- f219e26: Revise the fix guidance in twelve rule messages so it no longer steers toward a poor fix: `no-unsafe-array-access` leads with a real guard instead of a no-op ternary, `no-inline-disable` no longer offers editing the ESLint config, `no-llm-artifacts` no longer models invented issue numbers, `no-unbounded-promise-all` leads with dependency-free rewrites, `no-swallowed-errors` no longer assumes a vendor, and `no-dynamic-code-execution` dispatches through a `Map`. Smaller wording fixes to `max-complexity`, `no-magic-numbers`, `no-exported-function-expressions`, `no-incorrect-sort`, `prefer-unknown-in-catch`, and `no-redundant-logic`.

## 0.37.6

### Patch Changes

- d5573cb: Bring seven compressed TypeScript rule messages (`no-chained-type-assertions`, `no-known-value-widening`, `no-object-parameters`, `no-unknown-parameters`, `no-unknown-returns`, `no-unknown-type-aliases`, `no-unsafe-dictionary-type`) up to the what / why / how-to-fix template with a concrete before/after example, and add before/after examples to four `no-type-system-bypass` messages.

## 0.37.5

### Patch Changes

- 0d70885: `no-async-array-callbacks` now shows only the rewrite for the flagged method (`forEach`, `filter`, `some`, `every`, `reduce`, or `flatMap`) as a true before/after pair, instead of listing every method's recipe on each report.
- 0d70885: `explicit-export-types` messages now end with a line naming the parameter or function to annotate and warning not to satisfy the rule with `any` or `unknown`.
- 0d70885: `no-hallucinated-local-imports` messages now name the import path and missing binding, and list what does exist: the target module's direct named exports, or the modules in the target directory when the path does not resolve.
- 0d70885: `no-hallucinated-package-imports` now names the undeclared package and the `package.json` it checked, and presents the fix as three explicit outcomes.
- 0d70885: `no-weak-randomness-for-secrets` now names the variable, property, or function that receives the predictable value and shows a before/after rewrite.

## 0.37.4

### Patch Changes

- 7805b59: Stop `no-type-assertion-any`, `no-any-in-generic`, and `no-type-system-bypass` (explicit `any`) from recommending fixes that other recommended rules flag. Their messages no longer suggest `as unknown as T` or `Record<string, unknown>`, and now say where `unknown` is and is not accepted.

## 0.37.3

### Patch Changes

- 060ba31: Check indirect local function exports in `explicit-export-types`, including named and default identifier exports. Preserve primitive-default inference and avoid duplicate diagnostics for functions exported more than once.

## 0.37.2

### Patch Changes

- 38f26c0: Preserve strict boolean comparisons for unknown operands and preserve operator precedence when simplifying proven boolean expressions.
  
  Memoize boolean proofs per source file to avoid exponential expansion of shared constant initializers. Preserve strict comparisons on all method calls, whose return types cannot be guaranteed from syntax.
- 38f26c0: Preserve logical OR composition of established Set.has, RegExp.test, and String.endsWith predicates without assuming custom methods return booleans.
  
  Exclude constructor-based boolean proof after explicit global-object mutation or escape, so replaced global constructors cannot produce unsafe strict-comparison suggestions.
  
  Treat destructuring, default/rest, and loop assignment targets conservatively when checking global constructor replacement.
  
  Keep built-in predicate recognition as a nullish-warning suppression heuristic, separate from strict-comparison type proof, and decline recognition after relevant prototype access or constructor exposure.

## 0.37.1

### Patch Changes

- 192635f: Restore support for ESLint 10.11 consumers by correcting the peer dependency range. Development tooling remains on ESLint 10.12.

## 0.37.0

### Minor Changes

- 9fd29dd: Add `no-chained-type-assertions` to reject assertion chains that discard type evidence.
- 2a8c304: Add `no-known-value-widening` to reject broad annotations that discard concrete initializer evidence.
- 36d529e: Add `no-object-parameters` to require named input contracts instead of broad `object` parameters.
- 34251a1: Add `no-unknown-parameters` to require decoded domain inputs at function boundaries.
- 7e2f600: Add `no-unknown-returns` to require decoded domain types in function contracts.
- 8e2fbf7: Add `no-unknown-type-aliases` to keep undecoded boundary values visibly typed as `unknown`.
- a76ebc7: Add `no-unsafe-dictionary-type` to require concrete dictionary value contracts.

## 0.36.2

### Patch Changes

- b42bb1e: Update typescript-eslint dependencies and the plugin utils peer minimum to 8.69.0.

## 0.36.1

### Patch Changes

- bce1d45: Update the TypeScript ESLint utilities peer dependency and MCP parser dependency to 8.68.0.

## 0.36.0

### Minor Changes

- a5f621f: Add `no-widen-then-assert` to flag variables declared with a wider `T | undefined`/`T | null` type than their known value, then forced back to the narrow type with an assertion.

## 0.35.1

### Patch Changes

- 6747353: Move the plugin package into the workspace package directory without changing its public exports or CLI entrypoint.
