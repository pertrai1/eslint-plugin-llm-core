---
date: 2026-04-06
task: resolve explicit-export-types vs @typescript-eslint/no-inferrable-types conflict
domain: third-party-rule-conflicts
kind: code-convention
scope: cross-cutting
status: active
triggers:
  - resolving conflicts between llm-core rules and third-party plugins
  - considering adding third-party rule overrides to configs
  - modifying recommended or all config contents
applies_to:
  - src/index.ts
  - src/rules/*.ts
supersedes: []
---

# Resolve third-party rule conflicts by fixing our rule, not overriding theirs

## Context

`explicit-export-types` flagged parameters with primitive literal defaults (e.g., `x = 0`) as missing type annotations. This created an unresolvable conflict with `@typescript-eslint/no-inferrable-types`, which forbids annotations when the type is trivially inferred from the default. The issue reporter suggested shipping `@typescript-eslint/no-inferrable-types: ["error", { ignoreParameters: true }]` in our `recommended` config to resolve the conflict.

## Decision

We changed the rule's behavior to skip flagging parameters whose default value is a primitive literal (number, string, boolean, null, bigint, or negated number). This fixes the conflict at its source because TypeScript infers the type deterministically from a primitive literal, so the parameter effectively has a type contract without an explicit annotation. The key property of this approach is that it works regardless of what other plugins the user has enabled — it does not depend on config ordering or overrides.

## Rejected Alternatives

### Override `@typescript-eslint/no-inferrable-types` in our recommended config

This was the fix suggested in the issue. Rejected because our configs currently only contain our own rules. Adding third-party rule overrides creates a coupling: if `@typescript-eslint` changes the option name or behavior, our config breaks. It also surprises users who expect our config to only configure `llm-core/*` rules.

### Document the workaround without code changes

Rejected because documentation does not prevent the conflict — users would still hit the error and have to find and apply the workaround manually. A rule-level fix eliminates the problem entirely.

## Consequences

**Easier:** Users can enable both `tseslint.configs.recommended` and `llmCore.configs.recommended` without configuration conflicts on default parameters.

**Harder:** Users who want to enforce explicit annotations even on trivially-typed defaults cannot do so with this rule alone. They would need `@typescript-eslint/explicit-module-boundary-types` instead.

**Watch for:** Future conflicts with other `@typescript-eslint` rules should follow the same pattern: fix our rule's behavior rather than overriding third-party configs.
