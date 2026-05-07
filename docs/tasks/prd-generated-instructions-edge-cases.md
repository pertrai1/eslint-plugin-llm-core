# PRD: Generated Instructions Edge Cases

## Introduction/Overview

The generated instructions feature currently has two known edge cases in ESLint
configuration resolution:

1. Rules enabled for both JavaScript and TypeScript files with different option
   values can produce one combined instruction that uses the JavaScript options
   for all files.
2. Rules configured only for `.jsx`, `.tsx`, `.mjs`, or `.cjs` files can be
   omitted or scoped incorrectly because only `.js` and `.ts` virtual files are
   sampled.

This feature will make instruction generation accurately reflect supported
JavaScript and TypeScript file scopes, including per-scope option differences.
The goal is to prevent generated guidance from misrepresenting the lint rules
that actually apply to a user's files.

Reference: https://github.com/pertrai1/eslint-plugin-llm-core/issues/122

## Goals

1. Generate separate JavaScript and TypeScript instructions when the same rule is
   enabled in both scopes with different option values.
2. Preserve a single combined instruction when a rule applies to both scopes with
   equivalent options.
3. Sample ESLint configuration for `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, and
   `.tsx` virtual files.
4. Merge sampled extensions into broader JavaScript and TypeScript instruction
   scopes without losing rules that apply only to non-`.js` or non-`.ts`
   extensions.
5. Add regression tests that prove the two issue-reported edge cases are fixed.

## User Stories

1. As a developer using different rule options for JavaScript and TypeScript
   files, I want generated instructions to show the correct limits for each
   file type so agents do not follow incorrect guidance.
2. As a developer with rules configured only for JSX or TSX files, I want those
   rules to appear in generated instructions so active lint expectations are not
   silently omitted.
3. As a maintainer, I want the resolver behavior covered by regression tests so
   future changes do not reintroduce incorrect scope or option handling.

## Functional Requirements

1. The system must sample ESLint config using all of these virtual file names:
   `__virtual__.js`, `__virtual__.jsx`, `__virtual__.mjs`, `__virtual__.cjs`,
   `__virtual__.ts`, and `__virtual__.tsx`.
2. The system must treat `.js`, `.jsx`, `.mjs`, and `.cjs` as JavaScript scope
   inputs.
3. The system must treat `.ts` and `.tsx` as TypeScript scope inputs.
4. The system must include an active `llm-core` rule in the generated
   instructions when the rule is enabled in any sampled extension.
5. The system must compare rule options between the JavaScript and TypeScript
   scopes after extension sampling has been merged into those scopes.
6. When a rule is enabled in both JavaScript and TypeScript scopes with
   equivalent options, the system must emit one instruction scoped to all files.
7. When a rule is enabled in both JavaScript and TypeScript scopes with different
   options, the system must emit two instructions: one scoped to JavaScript files
   and one scoped to TypeScript files.
8. Each split instruction must interpolate message variables using the options
   for its own scope.
9. A rule configured only for `.jsx` or `.mjs`/`.cjs` files must be represented
   in the JavaScript instruction scope.
10. A rule configured only for `.tsx` files must be represented in the
    TypeScript instruction scope.
11. Existing behavior for rules that apply only to `.js` or only to `.ts` files
    must remain unchanged except where the broader extension sampling adds
    equivalent coverage.
12. Generated instructions must remain deterministic for the same ESLint config.

## Non-Goals (Out of Scope)

1. This feature will not add support for non-JavaScript languages.
2. This feature will not change the text templates for rule instructions except
   where interpolation now uses the correct per-scope options.
3. This feature will not introduce ESLint auto-fixes.
4. This feature will not change rule severity handling except as needed to
   identify active rules from sampled configs.
5. This feature will not optimize configuration resolution beyond avoiding
   unnecessary repeated work within the selected sampling approach.

## Design Considerations

No user interface changes are required. Output should continue to use the
existing generated instruction format and scope labels.

## Technical Considerations

1. The likely implementation area is `src/instructions/config-resolver.ts`.
2. Tests should use the existing generated-instructions test patterns and should
   assert concrete generated output rather than duplicating resolver logic.
3. Option equality should use the project's existing comparison pattern if one
   exists. If no helper exists, compare normalized rule options deterministically
   without relying on object identity.
4. The resolver should avoid emitting duplicate instructions when multiple
   extensions in the same broad scope produce the same rule/options result.
5. The expanded sampling adds more `calculateConfigForFile` calls, so the
   implementation should keep the extension list explicit and avoid repeated
   calls for the same virtual file.

## Success Metrics

1. A regression test proves that a rule with JavaScript option `{ max: 50 }` and
   TypeScript option `{ max: 30 }` emits separate scope-specific instructions
   with the correct interpolated values.
2. A regression test proves that a rule configured only for `.tsx` is included in
   generated TypeScript instructions.
3. A regression test proves that a rule configured only for `.jsx`, `.mjs`, or
   `.cjs` is included in generated JavaScript instructions.
4. Existing generated-instructions tests continue to pass.
5. Project quality gates for tests, lint, and build pass after implementation.

## Open Questions

1. Should `.mts` and `.cts` be supported in a future enhancement, or are they
   intentionally outside the current supported extension set? - these will not be supported in this implementation but could be added in the future if there is demand.
2. If multiple extensions within the same broad scope define the same rule with
   different options, should the resolver choose one deterministic option set,
   emit more specific instructions, or report an unsupported ambiguity? - the resolver will choose one deterministic option set based on the first sampled extension that defines the rule, but this should be documented as a known limitation.
