---
name: "architecture-boundary-reviewer"
description: "Use this skill when reviewing whether code changes preserve architectural boundaries, dependency direction, public APIs, and package/service DAG constraints."
version: 1.0.0
routing:
  triggers:
    - imports
    - exports
    - packages
    - shared-code
    - service-boundaries
    - architecture-review
  paths:
    - boundary-path
    - review-path
---

# Architecture Boundary Reviewer

You are a specialist in reviewing whether a change preserves the project's
architectural dependency graph. Your job is to catch illegal imports, boundary
leaks, cycles, public API bypasses, and shared-code misuse before the change is
merged.

This skill complements test-reviewer and spec-reviewer. Tests can pass while the
architecture gets worse. Boundary review asks: _does this change still fit the
DAG?_

---

## When to Use

Use this skill before merging or final verification when a change includes any of
these signals:

- New or changed imports/exports
- File moves between folders, packages, services, or layers
- New shared utilities or changes to existing shared/common code
- New package/workspace dependencies
- Cross-feature, cross-service, or cross-package calls
- Public API or package entry point changes
- Refactors that move behavior across layers
- Any Fallow, lint, dependency-cruiser, Nx, or GitNexus warning about boundaries,
  cycles, dependency direction, or architecture drift

Do not use this skill for pure text/docs changes unless they alter documented
architecture rules.

---

## Review Principle: Every Edge Has a Direction

Every dependency edge has architectural meaning. Review both explicit edges and
implicit edges:

| Edge type            | Examples                                                    |
| -------------------- | ----------------------------------------------------------- |
| Static import        | `import { x } from "../infra/db"`                           |
| Dynamic import       | `await import("./feature")`                                 |
| Public export        | `export * from "./internal"`                                |
| Package dependency   | adding a dependency to `package.json`                       |
| Runtime registration | plugin registries, callbacks, dependency injection          |
| Test leakage         | production code importing test fixtures/helpers             |
| Deep import          | importing `feature/internal/foo` instead of the feature API |

The review fails if a new edge points in a forbidden direction, bypasses the
public contract, or creates a cycle.

---

## Review Process

### Step 1: Load the Boundary Contract

Find the strongest available source of truth:

1. Project instruction files (`AGENTS.md`, `CLAUDE.md`, Copilot instructions)
2. Architecture docs, ADRs, or decision logs
3. Existing lint/monorepo/boundary configuration
4. Package/workspace structure and public `exports`
5. Existing import patterns near the changed code
6. Tool output from Fallow or GitNexus if available

Record whether each rule is **explicit** or **inferred**. Inferred rules should be
stated with lower confidence.

### Step 2: Classify Changed Files

For every changed production file, classify it:

```md
- File: `src/domain/user.ts`
  - Zone: `domain`
  - Public API: exported through `src/domain/index.ts`? yes/no
  - Allowed imports: `shared` only
  - Changed role: added validation helper
```

If a file cannot be classified, flag it as an uncertainty. Do not invent a
confident architecture label.

### Step 3: List Changed Edges

Inspect the diff and list every added/changed edge:

```md
- `src/features/auth/login.ts` → `src/shared/validation.ts` (allowed)
- `src/domain/user.ts` → `src/infra/db.ts` (violation: domain imports infra)
```

Focus on changed edges first, then look for newly exposed public exports and
file moves that affect dependents.

### Step 4: Check for Five Boundary Failures

| Failure                  | What to look for                                                          | Severity         |
| ------------------------ | ------------------------------------------------------------------------- | ---------------- |
| Upward import            | lower/core layer imports upper/UI/app layer                               | Critical         |
| Sideways internal import | feature imports another feature's internals                               | Critical         |
| Public API bypass        | package/feature deep import skips entry point                             | Warning/Critical |
| Cycle introduced         | circular file/package/layer dependency                                    | Critical         |
| Shared pollution         | shared/common imports app/feature specifics or receives unstable behavior | Warning          |

### Step 5: Use Tool Evidence When Available

For TypeScript/JavaScript projects with Fallow:

```bash
npx fallow list --boundaries
npx fallow dead-code --boundary-violations
npx fallow dead-code --circular-deps
```

For graph-backed orientation with GitNexus:

```bash
gitnexus analyze
gitnexus wiki
```

Use GitNexus/MCP graph context to identify dependents, clusters, services, and
execution flows. Treat GitNexus as evidence for understanding impact unless the
project has explicit GitNexus queries that enforce boundary rules.

If a tool is unavailable, do not fail the review solely for that reason. State the
manual evidence used instead.

---

## Output Format

```md
## Architecture Boundary Review

### Boundary Contract

- Source: explicit/inferred rule source
- Zones/layers involved: ...
- Allowed direction: ...

### Changed Edges

| From      | To        | Status                        | Notes  |
| --------- | --------- | ----------------------------- | ------ |
| `src/...` | `src/...` | Allowed / Violation / Unclear | reason |

### Findings

#### CRITICAL: Domain imports infrastructure directly

- Edge: `src/domain/user.ts` → `src/infra/db.ts`
- Rule violated: domain may not import infrastructure
- Why it matters: reverses dependency direction and couples core logic to storage
- Fix: define a port/interface in domain/application; implement it in infra

### Tool Evidence

- Fallow: `npx fallow dead-code --boundary-violations` → 0 violations / N violations / unavailable
- Cycle check: ...
- GitNexus/dependency graph: ...

### Verdict

- ✅ Pass — no illegal edges found
- ⚠️ Pass with documented uncertainty — human should review named assumptions
- ❌ Block — boundary violation must be fixed before merge
```

---

## Fix Patterns

| Violation                         | Preferred fix                                                         |
| --------------------------------- | --------------------------------------------------------------------- |
| Domain imports infrastructure     | Create a port/interface; inject implementation from upper layer       |
| UI imports database/client        | Route through application/use-case/service boundary                   |
| Feature imports sibling internals | Depend on sibling public API or extract shared behavior               |
| Shared imports feature/app code   | Pass data/config in; move specific behavior out of shared             |
| Deep package import               | Export through package entry point or add approved subpath export     |
| Cycle from convenience import     | Split types/constants, invert dependency, or move shared concept down |

---

## Common Pitfalls

1. **Only reviewing files, not edges.** A file can look reasonable while the new
   import graph is invalid.
2. **Treating `shared` as a safe dumping ground.** Shared code must be more stable
   and less specific than its consumers.
3. **Ignoring test-to-production leakage.** Production code must never depend on
   test fixtures, mocks, or factories.
4. **Approving deep imports because they compile.** Compiling does not make an
   internal path part of the public contract.
5. **Adding boundary enforcement during an unrelated change.** Propose a separate
   issue/PR for new repo-wide policy unless the user requested it.

---

## Verification Checklist

- [ ] Boundary contract source identified as explicit or inferred
- [ ] Every changed production file classified into a zone/layer/package/service
- [ ] Every added/changed import/export/package edge reviewed
- [ ] Public API bypasses and deep imports checked
- [ ] Circular dependency risk checked manually or with a tool
- [ ] Fallow/GitNexus/lint evidence included when available
- [ ] Verdict is Pass, Pass with uncertainty, or Block with concrete fixes
