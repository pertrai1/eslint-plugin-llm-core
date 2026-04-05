## What does this PR do?

<!-- Brief description of the change. Link to related issue(s) if applicable. -->

Closes #

## Checklist

- [ ] Linked to a GitHub issue (`Closes #<number>` above)
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
- [ ] `.agents/directives/SESSION_DECISIONS.md`
- [ ] If `SESSION_DECISIONS.md` was loaded **and** a non-obvious decision was made, a `docs/decisions/YYYY-MM-DD-<topic>.md` entry is included in this PR

**Instruction files NOT loaded (explain if unexpected):**

<!-- If a scoped instruction file was expected but not loaded, note it here. This helps identify gaps in applyTo glob coverage. -->
