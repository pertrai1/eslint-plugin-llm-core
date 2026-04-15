## What does this PR do?

<!-- Brief description of the change. Add `Closes #<number>` here if this PR resolves a GitHub issue. -->

## Verification

<!-- Required for all code changes. See .agents/directives/VERIFICATION.md for protocol. -->

<!-- For new rules and bug fixes: include Detection, Tests, Contract, and Docs proof. -->

<!-- For other code changes (CLI features, refactors, config): demonstrate correctness with evidence. -->

<!-- Docs-only changes (no src/ modifications) may omit this section. -->

<!-- ### Detection -->
<!-- ✅ Hit: [code that triggers the error] → [error message summary] -->
<!-- ✅ Clean: [code that should NOT trigger] → no error -->

<!-- ### Tests -->
<!-- List passing test cases: Valid / Invalid / Edge / Suggestions -->

<!-- ### Contract -->
<!-- - [ ] Exported from src/index.ts -->
<!-- - [ ] In correct config presets -->
<!-- - [ ] meta.docs.url correct -->
<!-- - [ ] meta.schema defined (if options exist) -->
<!-- - [ ] Message follows what/why/how-to-fix format -->
<!-- - [ ] Suggestions use actual code context -->

<!-- ### Docs -->
<!-- - [ ] Regenerated with npm run update:eslint-docs -->

## Checklist

- [ ] `npm run build` passes
- [ ] `npm run test` passes (new tests added if applicable)
- [ ] `npm run lint` passes
- [ ] `npm run update:eslint-docs` ran (if rules were added or changed)
- [ ] Docs added/updated (if adding a new rule: `docs/rules/<rule-name>.md`)
- [ ] Rule exported in `src/rules/index.ts` (if adding a new rule)
- [ ] Rule added to `recommendedRules` in `src/index.ts` (if applicable)

## Agent Disclosure (complete if this PR was authored by an AI agent)

<!-- List every instruction file the agent loaded during this PR. This creates an audit trail for progressive disclosure — which scoped instructions were active, and which were not. -->

**Agent:** <!-- e.g., GitHub Copilot, Claude Code -->

**Instruction files loaded:**

- [ ] `.github/copilot-instructions.md`
- [ ] `.github/instructions/rule-implementation.md`
- [ ] `.github/instructions/rule-tests.md`
- [ ] `.github/instructions/rule-docs.md`
- [ ] `.github/instructions/plugin-config.md`
- [ ] `AGENTS.md`
- [ ] `.agents/directives/TYPE_DRIVEN_DEVELOPMENT.md`
- [ ] `.agents/directives/TEST_DRIVEN_DEVELOPMENT.md`
- [ ] `.agents/directives/CODEBASE_NAVIGATION.md`
- [ ] `.agents/directives/ERROR_MEMORY.md`
- [ ] `.agents/directives/VERIFICATION.md`
- [ ] `.agents/directives/SESSION_DECISIONS.md`
- [ ] If `SESSION_DECISIONS.md` was loaded **and** this PR set a durable repo/process or cross-cutting decision whose reasoning is not obvious from the diff, a `docs/decisions/YYYY-MM-DD-<topic>.md` entry is included in this PR

**Instruction files NOT loaded (explain if unexpected):**

<!-- If a scoped instruction file was expected but not loaded, note it here. This helps identify gaps in applyTo glob coverage. -->
