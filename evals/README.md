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

npx tsx evals/src/run-eval.ts --mode treatment --fixture error-handling.ts
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

```
Parameter 'order' in exported function 'processOrder' is missing a type annotation.

Why: Exported function parameters should be declared in the contract, not inferred from usage.

How to fix:
  Before: export function processOrder(order) { ... }
  After:  export function processOrder(order: Order) { ... }
```

**Control** — the LLM receives only the first line:

```
Parameter 'order' in exported function 'processOrder' is missing a type annotation.
```

## Fixtures

| File                  | Target rules                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `error-handling.ts`   | no-empty-catch, throw-error-objects, prefer-unknown-in-catch, no-type-assertion-any, structured-logging                    |
| `type-safety.ts`      | explicit-export-types, no-any-in-generic, no-type-assertion-any, prefer-unknown-in-catch                                   |
| `code-style.ts`       | no-exported-function-expressions, prefer-early-return, no-redundant-logic, consistent-catch-param-name, naming-conventions |
| `hygiene.ts`          | no-commented-out-code, no-llm-artifacts, no-inline-disable, no-magic-numbers                                               |
| `mixed-violations.ts` | Mix from all categories                                                                                                    |

## Output

Reports are written to `evals/results/` (gitignored):

- `eval-YYYY-MM-DD.json` — structured results for programmatic analysis
- `eval-YYYY-MM-DD.md` — human-readable comparison table

Example markdown output:

```markdown
| Fixture           | Treatment (iterations) | Control (iterations) | Δ                    |
| ----------------- | ---------------------- | -------------------- | -------------------- |
| error-handling.ts | 1                      | 3                    | -2                   |
| type-safety.ts    | 1                      | 2                    | -1                   |
| **Average**       | **1.2**                | **2.6**              | **-1.4 (54% fewer)** |
```

## Architecture

```
evals/src/
  types.ts         — shared type definitions
  linter.ts        — ESLint Linter class wrapper (runs all plugin rules)
  strip-messages.ts — extracts first line of teaching messages (control mode)
  llm-client.ts    — Anthropic SDK wrapper
  eval-loop.ts     — iterative fix loop per fixture
  reporter.ts      — JSON + Markdown generation
  run-eval.ts      — CLI entry point
```
