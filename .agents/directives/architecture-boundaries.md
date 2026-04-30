---
name: architecture-boundaries
description: Preserves architecture DAG boundaries for imports, exports, packages, services, shared code, and dependency direction.
version: 1.0.0
triggers:
  - imports
  - exports
  - packages
  - architecture
  - shared-code
  - dependency-direction
routing:
  load: conditional
---

# Architecture Boundaries Directive

**When to load:** Load this directive before modifying imports, exports, module
structure, feature folders, shared utilities, service/package boundaries, or any
code whose correctness depends on dependency direction.

Passing tests is not enough if the change introduces an illegal dependency edge.
The agent must preserve the project's directed architecture graph.

---

## Core Rule: Preserve the DAG

Before implementation, identify the boundary context for every touched file:

1. **Zone** — Which architectural layer, package, feature, service, or module owns it?
2. **Allowed dependencies** — Which zones may this file import from?
3. **New edges** — What imports, exports, call paths, or package references will change?
4. **Forbidden edges** — Would any edge point upward, sideways, or across an internal boundary?

Forbidden by default unless the project explicitly allows it:

- Domain/core code importing UI, framework, infrastructure, or application code
- Shared/common utilities importing feature-specific or application-specific code
- Feature modules importing another feature's internals instead of its public API
- Presentation/UI importing database, filesystem, network, or infrastructure directly
- Tests or test helpers becoming production dependencies
- New circular dependencies between files, packages, layers, or services
- Cross-package imports that bypass the package's declared public entry point

If the project has explicit boundary rules, those override these defaults. If the
project has no explicit rules, infer the likely DAG from directory names,
package boundaries, and existing import patterns; document the inference before
changing code. If the inferred boundary materially changes the implementation
approach, ask the human or propose the inferred rule before coding.

---

## Boundary Discovery

Use progressive disclosure. Do not bulk-read the repository.

### 1. Find explicit rules first

Look for project-owned boundary definitions before inferring your own:

- `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`
- architecture docs, ADRs, decision logs, or contribution docs
- `package.json` workspaces and package `exports`
- `tsconfig.json` path aliases / project references
- lint rules such as `import/no-restricted-paths`, `boundaries`, `dependency-cruiser`, `nx`, or monorepo constraints
- Fallow config (`.fallowrc.json`, `.fallowrc.toml`, `fallow` config)

### 2. Classify touched files

For each file you expect to modify, record:

```md
- `path/to/file.ts`
  - Zone: `domain` / `application` / `ui` / `shared` / feature/package name
  - Public API: yes/no; entry point if yes
  - Allowed imports: list or inferred rule
  - Existing dependents: known callers/importers
```

### 3. Identify changed edges

Treat these as boundary-relevant changes:

- adding or changing an `import` / `require` / dynamic import
- moving a file between directories/packages
- exporting a symbol from a public entry point
- importing from a deep internal path such as `feature-x/internal/*`
- adding a package dependency or workspace reference
- introducing callbacks, dependency injection, or runtime registration across layers

---

## Tool-Assisted Boundary Checks

Tools accelerate discovery, but the rule is portable: if a tool is unavailable,
fall back to inspecting config, imports, and dependents manually.

### Fallow for TypeScript/JavaScript enforcement

If Fallow is available in a TypeScript/JavaScript project, prefer it for boundary
evidence:

```bash
npx fallow list --boundaries
npx fallow dead-code --boundary-violations
npx fallow dead-code --circular-deps
```

Useful presets include:

```jsonc
{ "boundaries": { "preset": "layered" } }        // presentation → application → domain
{ "boundaries": { "preset": "hexagonal" } }     // adapters → ports → domain
{ "boundaries": { "preset": "feature-sliced" } } // app > pages > widgets > features > entities > shared
{ "boundaries": { "preset": "bulletproof" } }   // app → features → shared/server
```

If the project has no Fallow boundary config, do not silently add one during an
unrelated task. Either infer boundaries for the current change only, or propose a
separate issue/PR to introduce explicit enforcement.

### GitNexus for graph-backed orientation

If GitNexus is available, use it to understand dependency and call-chain impact
before cross-cutting changes:

```bash
gitnexus analyze
gitnexus wiki
gitnexus serve
```

Use GitNexus graph/MCP context to answer:

- What imports or calls this file/symbol?
- Which functional cluster or service owns it?
- Which execution flows are affected?
- Does the proposed change cross a service/package/feature boundary?

GitNexus is best treated as boundary intelligence. Use project rules or a
checker such as Fallow/lint/CI for enforcement unless the project has explicit
GitNexus graph queries for boundary violations.

---

## Boundary Design Patterns

When a needed dependency would violate the DAG, do not punch through the boundary.
Use one of these instead:

| Problem                                | Prefer                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------- |
| Domain needs infrastructure behavior   | Define a domain/application port; implement it in infrastructure          |
| UI needs data access                   | Call application/use-case layer; do not import database/client directly   |
| Feature A needs Feature B behavior     | Depend on Feature B's public API or move shared behavior to shared/domain |
| Shared utility needs feature config    | Pass config as data; do not import feature code                           |
| Lower layer needs upper-layer callback | Invert dependency with an interface, event, or injected function          |
| Cross-package import reaches internals | Export through the package entry point or add an explicit public module   |

---

## Boundary Verification Output

Before final gates, include a boundary section in the verification summary for
any Full Path task that touches imports, exports, folders, packages, or shared
code:

```md
### Architecture Boundaries

- Modified zones:
  - `src/features/auth/**` → `feature/auth`
  - `src/shared/validation.ts` → `shared`
- Changed dependency edges:
  - `feature/auth` imports `shared/validation`
- Checks:
  - [x] No upward imports
  - [x] No sibling feature internal imports
  - [x] No production imports from tests
  - [x] No new circular dependency
  - [x] Boundary tool/lint check passed, or unavailable with reason
- Tool evidence:
  - `npx fallow dead-code --boundary-violations` → 0 violations
```

If a violation is found, the implementation is not ready. Either fix the design
or ask the human before proceeding.

---

## Forbidden Patterns

| Pattern                                             | Why Forbidden                                              |
| --------------------------------------------------- | ---------------------------------------------------------- |
| "Tests pass, so the import is fine"                 | Tests do not prove architectural validity                  |
| Importing across a forbidden layer to save time     | Creates coupling that future changes pay for               |
| Deep-importing another feature's internals          | Bypasses the public contract and breaks encapsulation      |
| Adding boundary config as a drive-by change         | Boundary policy is cross-cutting and needs explicit review |
| Ignoring cycles because runtime still works         | Cycles degrade build, test, and refactor reliability       |
| Moving code to `shared` without checking dependents | `shared` can become a dumping ground and reverse the DAG   |

---

## Quick Reference

| Phase      | Action                                             | Evidence                 |
| ---------- | -------------------------------------------------- | ------------------------ |
| ORIENT     | Load project rules and classify touched files      | Zone + allowed imports   |
| PLAN       | Identify changed dependency edges                  | Edge list                |
| IMPLEMENT  | Use ports/public APIs instead of forbidden imports | No illegal import added  |
| SELF-AUDIT | Ask what boundary assumption could collapse        | Jenga entry if uncertain |
| VERIFY     | Run boundary checks or document manual proof       | Boundary section in PR   |

_This directive complements type-first development, TDD, and verification: types
prove shapes, tests prove behavior, and boundary checks prove architectural fit._
