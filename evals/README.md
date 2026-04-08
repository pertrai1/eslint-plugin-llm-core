# Fix-Iteration Eval Harness

Measures how many edit→lint cycles an LLM needs to resolve violations when using **structured teaching messages** (treatment) versus **terse first-line-only messages** (control).

## Prerequisites

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Running Evals

```bash
npm run eval                         # both modes, all fixtures
npm run eval:treatment               # treatment mode only
npm run eval:control                 # control mode only
```

Or directly with options:

```bash
npx tsx evals/src/run-eval.ts --help

npx tsx evals/src/run-eval.ts --mode treatment --fixture api-service.ts
npx tsx evals/src/run-eval.ts --model claude-opus-4-5 --max-iterations 3
npx tsx evals/src/run-eval.ts --output /tmp/eval-results
```

## CLI Options

| Flag                              | Default                    | Description                                               |
| --------------------------------- | -------------------------- | --------------------------------------------------------- |
| `--mode treatment\|control\|both` | `both`                     | Which message format to test                              |
| `--model <name>`                  | `claude-sonnet-4-20250514` | Anthropic model                                           |
| `--fixture <name>`                | _(all)_                    | Run one fixture; repeatable                               |
| `--max-iterations <n>`            | `5`                        | Max fix cycles per fixture                                |
| `--output <dir>`                  | `evals/results`            | Where to write reports                                    |
| `--compact`                       |                            | Strip trace fields from resolved fixtures in JSON output  |
| `--replay <file>`                 |                            | Replay a specific iteration from a saved eval (see below) |
| `--iteration <n>`                 |                            | Iteration number to replay (use with `--replay`)          |

## Modes

**Treatment** — the LLM receives the plugin's full structured message:

```text
Parameter 'order' in exported function 'processOrder' is missing a type annotation.

Why: Exported function parameters should be declared in the contract, not inferred from usage.

How to fix:
  Before: export function processOrder(order) { ... }
  After:  export function processOrder(order: Order) { ... }
```

**Control** — the LLM receives only the first line:

```text
Parameter 'order' in exported function 'processOrder' is missing a type annotation.
```

## Fixtures

| File                    | Target rules                                                                                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api-service.ts`        | explicit-export-types, no-exported-function-expressions, structured-logging, no-type-assertion-any, no-magic-numbers, prefer-early-return                                    |
| `auth-middleware.ts`    | prefer-early-return, max-nesting-depth, structured-logging, no-magic-numbers, throw-error-objects, no-empty-catch, no-type-assertion-any, explicit-export-types              |
| `config-loader.ts`      | no-exported-function-expressions, explicit-export-types, no-redundant-logic, structured-logging, no-magic-numbers, prefer-unknown-in-catch, no-empty-catch                   |
| `data-transformer.ts`   | no-exported-function-expressions, explicit-export-types, no-type-assertion-any, no-any-in-generic, no-async-array-callbacks, no-redundant-logic                              |
| `error-pipeline.ts`     | no-empty-catch, throw-error-objects, prefer-unknown-in-catch, structured-logging, no-redundant-logic, no-magic-numbers                                                       |
| `event-system.ts`       | naming-conventions, no-exported-function-expressions, explicit-export-types, no-async-array-callbacks, consistent-catch-param-name, throw-error-objects, prefer-early-return |
| `integration-module.ts` | no-commented-out-code, no-llm-artifacts, no-inline-disable, explicit-export-types, no-async-array-callbacks, max-params, structured-logging                                  |

## Output

Reports are written to `evals/results/` (gitignored):

- `eval-YYYY-MM-DD.json` — full results with decision traces for debugging
- `eval-YYYY-MM-DD.md` — human-readable comparison table with diagnostics
- `history.jsonl` — append-only log for cross-run trend analysis

Example markdown output:

```markdown
| Fixture         | Treatment (iterations) | Control (iterations) | Δ                    |
| --------------- | ---------------------- | -------------------- | -------------------- |
| api-service.ts  | 2                      | 4                    | -2                   |
| event-system.ts | 2                      | 5                    | -3                   |
| **Average**     | **1.2**                | **2.6**              | **-1.4 (54% fewer)** |
```

When failure patterns are detected, the markdown includes a diagnostics section:

```markdown
### Diagnostics

- **Stuck rules**: llm-core/no-magic-numbers
- **Oscillating rules**: llm-core/explicit-export-types
- **Cascading errors**: at least one iteration introduced new violations
```

### Decision Traces

Each iteration record in the JSON output includes:

| Field           | Description                                                |
| --------------- | ---------------------------------------------------------- |
| `promptSent`    | Full prompt sent to the LLM                                |
| `llmResponse`   | Raw LLM response before code extraction                    |
| `codeDiff`      | Line-based diff between input and output code              |
| `tokenUsage`    | `{ inputTokens, outputTokens }` for cost tracking          |
| `reasoning`     | LLM's stated reasoning (extracted from `<reasoning>` tags) |
| `violationDiff` | `{ resolved, persisted, introduced }` violation arrays     |
| `startedAt`     | ISO timestamp when the iteration started                   |
| `completedAt`   | ISO timestamp when the iteration finished                  |
| `durationMs`    | Wall-clock duration of the iteration                       |

Use `--compact` to strip trace fields (`promptSent`, `llmResponse`, `codeDiff`, `reasoning`) from resolved fixtures. Failed fixtures always keep their full traces.

### Failure Patterns

Each fixture result includes a `patterns` object:

- **Stuck rules** — `ruleId`s that persist across every iteration (the LLM can't fix them)
- **Oscillating rules** — `ruleId`s that are resolved then reintroduced (fix bouncing)
- **Cascading errors** — `true` if any iteration introduced new violations not present before

## Querying Results

Query across accumulated eval runs using the query CLI:

```bash
# Per-rule appearance counts (which rules are hardest?)
npx tsx evals/src/run-query.ts --by-rule

# Filter by mode
npx tsx evals/src/run-query.ts --by-rule --mode control

# Fixtures that never fully resolved
npx tsx evals/src/run-query.ts --unresolved

# Rules that were stuck across all iterations
npx tsx evals/src/run-query.ts --stuck-rules
```

Queries read from `eval-*.json` files in the results directory. Use `--input <dir>` to point at a different directory.

## Replaying Iterations

Re-run a specific iteration from a saved trace to test whether a modified teaching message would change the outcome:

```bash
npx tsx evals/src/run-eval.ts \
  --replay evals/results/eval-2026-04-08.json \
  --fixture api-service.ts \
  --mode treatment \
  --iteration 2
```

This loads the stored prompt from iteration 2 and re-sends it to the LLM, displaying the reasoning and response. Useful for A/B testing message changes without re-running the full eval.

Requirements for `--replay`:

- Exactly one `--fixture`
- Explicit `--mode` (not `both`)
- `--iteration` number
- The target iteration must have a stored `promptSent` (won't work with `--compact` output for resolved fixtures)

## Architecture

```text
evals/src/
  types.ts          — shared type definitions (TokenUsage, ViolationDiff, FailurePatterns, etc.)
  linter.ts         — ESLint Linter class wrapper (runs all plugin rules)
  strip-messages.ts — extracts first line of teaching messages (control mode)
  llm-client.ts     — Anthropic SDK wrapper, reasoning extraction
  eval-loop.ts      — iterative fix loop with trace capture
  violation-diff.ts — resolved/persisted/introduced violation categorization
  patterns.ts       — stuck rule, oscillation, and cascading error detection
  code-diff.ts      — line-based code diff between iterations
  reporter.ts       — JSON + Markdown + history.jsonl generation
  replay.ts         — iteration trace lookup for replay
  query.ts          — cross-run query functions (by-rule, unresolved, stuck-rules)
  run-eval.ts       — eval CLI entry point
  run-query.ts      — query CLI entry point
```
