# Copilot Instructions for eslint-plugin-llm-core

## What This Project Is

A framework-agnostic ESLint plugin (TypeScript, strict mode) that helps LLM agents self-correct. Rules use `@typescript-eslint/utils` and the visitor pattern over AST nodes.

## Mandatory Development Workflow

All code changes follow this strict sequence. No skipping steps. No exceptions.

| Step | Phase    | Action                                   | Verify                                                                |
| ---- | -------- | ---------------------------------------- | --------------------------------------------------------------------- |
| 1    | TYPES    | Define types in `types.ts` or co-located | `tsc --noEmit` passes                                                 |
| 2    | RED      | Write ONE failing test                   | Test fails                                                            |
| 3    | GREEN    | Write minimum code to pass               | New test passes, all existing tests still pass, `tsc --noEmit` passes |
| 4    | REFACTOR | Clean up if needed                       | All tests still pass                                                  |
| 5    | GATES    | Run quality gates                        | `npm test && npm run lint && npm run build`                           |
| 6    | COMMIT   | Atomic commit (one behavior per commit)  | `test:` commit before every `feat:` commit                            |

Steps 2-6 repeat for each behavior. Do not batch multiple behaviors into one cycle.

### Commit Messages

Each RED/GREEN cycle produces separate commits:

```
test: failing test for <rule-name> <behavior description>
feat: <rule-name> <behavior description>
```

If there is no `test:` commit before a `feat:` commit, the RED phase was skipped.

## Adding a New Rule

1. Create rule file: `src/rules/<rule-name>.ts` using `createRule` from `src/utils/create-rule.ts`
2. Export from `src/rules/index.ts`
3. If the rule belongs in `recommended`, add it to the appropriate category object in `src/index.ts`
4. Add tests: `tests/rules/<rule-name>.test.ts`
5. Add docs: `docs/rules/<rule-name>.md`
6. Run `npm run update:eslint-docs` to regenerate README and rule doc headers

## Commands

- `npm run build` -- compile TypeScript to dist/
- `npm run test` -- run tests with vitest
- `npm run lint` -- run ESLint
- `npm run format` -- run Prettier
- `npm run update:eslint-docs` -- regenerate rule docs

## Scope Constraints

Rules must be framework-agnostic and work without project-specific configuration.

Out of scope:

- Layer boundaries (domain/presentation/infrastructure)
- Factory-over-class enforcement
- DTO/schema collocation

## Forbidden Patterns

- `any` type or implicit `any`
- `Function` type
- `it.skip()` in tests
- Writing implementation before a failing test exists
- Batching multiple behaviors into one commit
- `expect(true).toBe(true)` or other fake assertions

## Pull Requests

When opening a PR, complete the "Agent Disclosure" section in the PR template. Check every instruction file you loaded and note any that were expected but missing.

## Versioning

Use [Changesets](https://github.com/changesets/changesets) for versioning. Never run `npm run version` locally -- push the changeset file and let CI open the version PR.
