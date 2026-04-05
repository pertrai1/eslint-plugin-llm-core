---
applyTo: "**"
---

# Pull Request Requirements

## Before Opening a PR

Run all quality gates locally:

```bash
npm test && npm run lint && npm run build
```

If rules were added or changed, also run:

```bash
npm run update:eslint-docs
```

## PR Template (CI-Enforced)

The PR template at `.github/PULL_REQUEST_TEMPLATE.md` has three required sections. **CI will block merge if these are incomplete.**

### 1. Checklist

Every box must be checked. If a checklist item doesn't apply, check it and note "(N/A)" next to it.

```markdown
- [x] `npm run build` passes
- [x] `npm run test` passes (new tests added if applicable)
- [x] `npm run lint` passes
- [x] `npm run update:eslint-docs` ran (if rules were added or changed)
- [x] Docs added/updated (if adding a new rule: `docs/rules/<rule-name>.md`)
- [x] Rule exported in `src/rules/index.ts` (if adding a new rule)
- [x] Rule added to `recommendedRules` in `src/index.ts` (if applicable)
```

### 2. Agent Disclosure

If you are an AI agent, you MUST complete this section:

- **Agent:** — Write your name (e.g., "GitHub Copilot", "Claude Code")
- **Instruction files loaded:** — Check every file you actually received and processed
- **Instruction files NOT loaded:** — Explain any gaps

### 3. Commit History

CI validates that `feat:` commits have preceding `test:` commits. If your PR has implementation code, it must also have test commits. See the commit cadence in `copilot-instructions.md`.
