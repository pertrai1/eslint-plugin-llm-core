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

| Flag                              | Default                    | Description                  |
| --------------------------------- | -------------------------- | ---------------------------- |
| `--mode treatment\|control\|both` | `both`                     | Which message format to test |
| `--model <name>`                  | `claude-sonnet-4-20250514` | Anthropic model              |
| `--fixture <name>`                | _(all)_                    | Run one fixture; repeatable  |
| `--max-iterations <n>`            | `5`                        | Max fix cycles per fixture   |
| `--output <dir>`                  | `evals/results`            | Where to write reports       |

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

- `eval-YYYY-MM-DD.json` — structured results for programmatic analysis
- `eval-YYYY-MM-DD.md` — human-readable comparison table

Example markdown output:

```markdown
| Fixture         | Treatment (iterations) | Control (iterations) | Δ                    |
| --------------- | ---------------------- | -------------------- | -------------------- |
| api-service.ts  | 2                      | 4                    | -2                   |
| event-system.ts | 2                      | 5                    | -3                   |
| **Average**     | **1.2**                | **2.6**              | **-1.4 (54% fewer)** |
```

## Architecture

```text
evals/src/
  types.ts         — shared type definitions
  linter.ts        — ESLint Linter class wrapper (runs all plugin rules)
  strip-messages.ts — extracts first line of teaching messages (control mode)
  llm-client.ts    — Anthropic SDK wrapper
  eval-loop.ts     — iterative fix loop per fixture
  reporter.ts      — JSON + Markdown generation
  run-eval.ts      — CLI entry point
```
