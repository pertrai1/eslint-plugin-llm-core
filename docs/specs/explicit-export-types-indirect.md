# Indirect local function exports

Issue: https://github.com/pertrai1/eslint-plugin-llm-core/issues/26

## Proposal and scope

`explicit-export-types` should apply its existing parameter and return type checks
to local functions exported through named specifiers or a default identifier. Use
ESLint scope bindings rather than matching names across the file. Reuse the
existing checker and deduplicate by function node. This avoids false matches in
nested scopes and repeat diagnostics when a function has multiple exports.

Scope budget: change only the rule, its focused tests and documentation, this
specification, and a patch changeset. Do not change configuration, dependencies,
primitive-default inference, or cross-module analysis.

The existing inline-only approach leaves known false negatives. Recursively
following aliases or assignments would expand the contract and is deferred.

## Acceptance criteria

- Local value export specifiers, including renamed and default specifiers, resolve
  function declarations and variables initialized directly with arrows or function
  expressions. Declarations after the export are resolved as well.
- Default identifier exports resolve the same local declarations.
- Missing parameter and return annotations use the existing messages and source
  locations, naming the local binding rather than the exported alias.
- Each underlying function is checked once even when exported multiple ways,
  including an inline declaration plus later specifiers or default identifiers.
- Explicitly typed functions and parameters with primitive defaults remain valid
  under the existing checker. Non-literal and destructured defaults are still
  checked. Nested unexported functions must not be diagnosed.
- Type-only exports, imports, source re-exports, ambient declarations, non-function
  bindings, destructured bindings, identifier aliases, and later assignments are
  outside this change. No cross-file or data-flow inference is performed.

## Verification plan

First reproduce a named-specifier failure, implement local binding resolution,
then reproduce default-identifier and duplicate-export cases before extending the
visitor. Add explicit clean and invalid cases for the boundaries above. Run the
focused suite, all tests, build, lint, formatting and generated-doc checks, then
review the diff independently and verify CI on the draft PR's final commit.
