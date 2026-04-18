# Contributing to eslint-plugin-llm-core

Thanks for your interest in contributing! This plugin helps LLM agents write cleaner code, and community contributions are welcome.

## Getting Started

```bash
git clone https://github.com/pertrai1/eslint-plugin-llm-core.git
cd eslint-plugin-llm-core
npm install
npm run build
npm run test
```

## Development Commands

| Command                      | Description                     |
| ---------------------------- | ------------------------------- |
| `npm run build`              | Compile TypeScript to `dist/`   |
| `npm run test`               | Run tests with vitest           |
| `npm run test:watch`         | Run tests in watch mode         |
| `npm run test:coverage`      | Run tests with coverage report  |
| `npm run lint`               | Run ESLint                      |
| `npm run format`             | Run Prettier                    |
| `npm run update:eslint-docs` | Regenerate rule docs and README |

## Adding a New Rule

1. **Propose it first** — Open an issue using the "New Rule Proposal" template. The proposal must satisfy the [rule acceptance criteria](AGENTS.md#rule-acceptance-criteria) in `AGENTS.md`.

2. **Create the rule file** — `src/rules/my-rule.ts` using `createRule` from `src/utils/create-rule.ts`. Look at existing rules for the pattern.

3. **Export the rule** — Add it to `src/rules/index.ts`.

4. **Add to recommended** (if applicable) — Add it to `recommendedRules` in `src/index.ts`. Most rules that catch real bugs or common LLM mistakes belong here.

5. **Write tests** — `tests/rules/my-rule.test.ts` using `RuleTester` from `@typescript-eslint/rule-tester`. Cover both valid and invalid cases thoroughly.

6. **Write docs** — `docs/rules/my-rule.md` with Rule Details, Examples (Incorrect/Correct), What This Rule Catches, and Error Messages sections. Don't include `Options` or `Config` headers for rules with no options — the doc generator handles config headers automatically.

7. **Regenerate docs** — Run `npm run update:eslint-docs` to update the README rules table and doc headers.

## Rule Design Guidelines

### Error Messages

Every error message must follow the structured teaching format:

1. **What's wrong** — the specific violation
2. **Why it matters** — the rationale
3. **How to fix** — concrete before/after examples

This structure is what makes the plugin effective for LLM self-correction.

### Scope

Rules must be **framework-agnostic** — they should work in any TypeScript/JavaScript codebase without project-specific configuration. If a rule only makes sense for a specific architecture or framework, it's out of scope.

### Rule Acceptance Criteria

`AGENTS.md` is the canonical source for rule acceptance criteria.
See the [Rule Acceptance Criteria](AGENTS.md#rule-acceptance-criteria) in `AGENTS.md`.

### Suggestions vs. Auto-fixes

Use **suggestions** (not auto-fixes) when the transformation could change semantics. This keeps the developer in control.

### Type Safety

Never use `as any`, `@ts-ignore`, or `@ts-expect-error` in rule implementations.

## Commit Messages

This project uses [conventional commits](https://www.conventionalcommits.org/):

- `feat: add no-async-foreach rule` — new features
- `fix: handle edge case in no-magic-numbers` — bug fixes
- `docs: update contributing guide` — documentation only
- `chore: update dependencies` — maintenance

Commit messages are enforced by commitlint via a git hook.

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Make your changes following the guidelines above
3. Ensure all checks pass: `npm run build && npm run test && npm run lint`
4. Run `npm run update:eslint-docs` if you added or changed rules
5. Open a PR against `main`

## Working with AI Coding Agents

If you are prompting an AI coding agent for non-trivial work, do not rely on
generic requests like "clean this up" or "make it better." State the problem,
success criteria, constraints, and boundaries that actually shape the change.

Use these repo docs:

- [AGENTS.md](AGENTS.md) for mandatory agent workflow
- [docs/guides/prompting-ai-coding-agents.md](docs/guides/prompting-ai-coding-agents.md) for a human-facing prompt and review guide
- [docs/guides/agent-task-framing.md](docs/guides/agent-task-framing.md) for the repo-specific intake checklist agents should follow on ambiguous or cross-cutting tasks

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets) for versioning. You don't need to create a changeset — maintainers will handle that when merging.

## Questions?

Open an issue if something is unclear. We're happy to help.
