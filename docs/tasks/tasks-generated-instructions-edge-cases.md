# Tasks: Generated Instructions Edge Cases

Source PRD: `tasks/prd-generated-instructions-edge-cases.md`  
GitHub Issue: https://github.com/pertrai1/eslint-plugin-llm-core/issues/122

## Relevant Files

- `src/instructions/config-resolver.ts` - likely resolver logic for virtual file sampling, scope derivation, rule option comparison, and instruction emission.
- `tests/instructions/*` or the existing generated-instructions test file - add regression coverage for the issue-reported edge cases.
- `.github/instructions/rule-tests.md` - scoped test-writing guidance if rule-style test patterns apply.
- `.agents/directives/test-driven-development.md` - required RED/GREEN/REFACTOR workflow for behavior changes.
- `.agents/skills/test-reviewer/SKILL.md` - required review lens before adding or reviewing tests.

## Tasks

- [x] 1.0 Orient on generated-instructions resolver behavior
  - [x] 1.1 Locate the existing generated-instructions resolver tests.
  - [x] 1.2 Read the public shape returned by `src/instructions/config-resolver.ts`.
  - [x] 1.3 Identify how the resolver currently represents `js`, `ts`, and `all` scopes.
  - [x] 1.4 Identify how rule options are currently normalized, compared, and interpolated into instruction text.

- [x] 2.0 Add RED coverage for dual-scope option drift
  - [x] 2.1 Add one failing regression test for a rule enabled in JavaScript with `{ max: 50 }` and TypeScript with `{ max: 30 }`.
  - [x] 2.2 Assert the generated output emits separate JavaScript and TypeScript instructions.
  - [x] 2.3 Assert each split instruction interpolates the option value from its own scope.
  - [x] 2.4 Run the targeted test and confirm it fails for the missing split-scope behavior.

- [x] 3.0 Implement dual-scope split behavior
  - [x] 3.1 Compare merged JavaScript and TypeScript rule options for each active rule.
  - [x] 3.2 Keep one `all` instruction when both scopes have equivalent options.
  - [x] 3.3 Emit separate JavaScript and TypeScript instructions when both scopes are active but options differ.
  - [x] 3.4 Ensure interpolation uses the option set for the instruction's emitted scope.
  - [x] 3.5 Run the targeted regression test and confirm it passes.

- [x] 4.0 Add RED coverage for expanded virtual file sampling
  - [x] 4.1 Add one failing regression test proving `.tsx`-only configuration is included in TypeScript instructions.
  - [x] 4.2 Add one failing regression test proving `.jsx`-only configuration is included in JavaScript instructions.
  - [x] 4.3 Add coverage for `.mjs` and `.cjs` JavaScript sampling, either as focused cases or a table-driven variant with concrete expected output.
  - [x] 4.4 Run the targeted tests and confirm they fail because unsupported extensions are not sampled.

- [x] 5.0 Implement expanded extension sampling
  - [x] 5.1 Define the explicit virtual file sample set: `__virtual__.js`, `__virtual__.jsx`, `__virtual__.mjs`, `__virtual__.cjs`, `__virtual__.ts`, and `__virtual__.tsx`.
  - [x] 5.2 Merge `.js`, `.jsx`, `.mjs`, and `.cjs` results into the JavaScript scope.
  - [x] 5.3 Merge `.ts` and `.tsx` results into the TypeScript scope.
  - [x] 5.4 Deduplicate equivalent rules/options within the same broad scope.
  - [x] 5.5 Use a deterministic rule when multiple extensions in the same broad scope define the same rule with different options.
  - [x] 5.6 Document the same-scope option-conflict limitation in code only if the implementation would otherwise be unclear.
  - [x] 5.7 Run the targeted extension-sampling tests and confirm they pass.

- [ ] 6.0 Verify existing behavior and test quality
  - [ ] 6.1 Confirm existing `.js`-only and `.ts`-only behavior still passes.
  - [ ] 6.2 Confirm equivalent JavaScript and TypeScript options still produce one `all` instruction.
  - [ ] 6.3 Review new tests for concrete expected output and no production-logic mirroring.
  - [ ] 6.4 Run the generated-instructions test file or targeted test suite.

- [ ] 7.0 Run final quality gates
  - [ ] 7.1 Run `npm run test`.
  - [ ] 7.2 Run `npm run lint`.
  - [ ] 7.3 Run `npm run build`.
  - [ ] 7.4 Run `npm run update:eslint-docs` only if the implementation changes generated rule docs.
  - [ ] 7.5 Capture a verification summary showing the previously failing cases now pass and no regressions were introduced.

- [ ] 8.0 Prepare review artifacts
  - [ ] 8.1 Include the PRD and task list in the implementation context.
  - [ ] 8.2 Link GitHub Issue #122 in the PR body.
  - [ ] 8.3 Include a concise debugging summary explaining the root cause and fix.
  - [ ] 8.4 Include verification commands and results in the PR body.
