# `lint_file` directory-cap benchmark

Discovery for **PRD Open Question #1** / **Assumption A1**: what default maximum
file count should `lint_file` enforce for directory targets before asking the
caller to narrow the path?

## Run

```sh
# from packages/mcp-server
node benchmarks/dir-lint.mjs
```

The script generates throwaway projects (inside `benchmarks/`, so the temp
`eslint.config.js` can resolve `eslint-plugin-llm-core` from the repo's
`node_modules`) of increasing size and times `eslint.lintFiles()` on the
directory, using the same flat-config + `@typescript-eslint/parser` path the
MCP server uses. Each measurement is preceded by a warm-up run so parser/plugin
(and, for type-aware mode, the TypeScript program) load cost is excluded from
the timing.

## Results (Node 24, M-series, trivial 6-line files)

### AST-only (no type information — what the llm-core rules require)

| files | total ms | per-file ms |
| ----- | -------- | ----------- |
| 10    | 6        | 0.65        |
| 50    | 13       | 0.26        |
| 100   | 21       | 0.21        |
| 200   | 33       | 0.16        |
| 400   | 66       | 0.16        |
| 800   | 124      | 0.16        |

### Type-aware (`parserOptions.projectService`)

| files | total ms | per-file ms |
| ----- | -------- | ----------- |
| 50    | 22       | 0.43        |
| 100   | 39       | 0.39        |
| 200   | 102      | 0.51        |
| 400   | 264      | 0.66        |

## Finding

- **Keep the default cap at 200 (configurable).** No change warranted.
- All llm-core rules are AST-only, where even 800 files lint in ~120 ms — far
  under any interactive threshold. The cap is not needed to protect AST-only
  linting; it exists to bound worst-case latency on large and/or type-aware
  trees and to avoid silently linting an entire monorepo.
- Type-aware configs scale worse (rising per-file cost), and these numbers are
  **optimistic**: the fixture files are tiny with no cross-file types or real
  dependency graph. On realistic codebases the dominant cost is the one-time
  TypeScript **program build**, which is incurred regardless of how many files
  the target expands to — so the cap limits the per-file portion but not the
  program build. 200 keeps the per-file portion comfortably bounded while
  remaining generous enough for typical single-directory targets.
- The limit is configurable via `maxFiles`, so consumers on unusually heavy
  type-aware setups can lower it; a future version may switch from a static cap
  to a time-budgeted guard.
