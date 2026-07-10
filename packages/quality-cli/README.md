# llm-core-quality

`llm-core-quality` is a small quality-gate CLI for projects that want to run
`eslint-plugin-llm-core`, ESLint, and Knip from one command and emit consistent
human, JSON, or SARIF output.

```bash
llm-core-quality scan
llm-core-quality scan --json
llm-core-quality scan --json --compact
llm-core-quality scan --sarif
llm-core-quality ci
```

## Commands

### `scan`

Runs the configured quality engines and prints a report. Findings do not fail the
process by default so agents can inspect results without aborting their turn.

```bash
llm-core-quality scan src tests
llm-core-quality scan --json
llm-core-quality scan --sarif --engine eslint
```

### `ci`

Runs the same engines but exits non-zero when findings are present.

```bash
llm-core-quality ci
llm-core-quality ci --json --compact
```

## Output

The default text reporter is optimized for terminal review:

- grouped findings by relative file path
- per-engine completion lines
- severity summary (`errors`, `warnings`, `notices`)
- color auto-detection for TTY output

Machine-readable formats are pretty-printed by default and can be compacted for
scripts:

```bash
llm-core-quality scan --json --compact
llm-core-quality scan --sarif --compact
```

Use `--color` to force ANSI colors or `--no-color` to disable colors. JSON and
SARIF output never include terminal colors.

## Engines

The initial skeleton invokes:

- ESLint with JSON formatting
- Knip with JSON reporting

Use `--engine eslint`, `--engine knip`, or `--engine eslint,knip` to limit the
engines for a run.

## Exit behavior

- `scan` exits zero for findings by default.
- `ci` exits non-zero for findings by default.
- `--fail-on-findings` forces finding-sensitive exit behavior.
- `--no-exit-code` suppresses finding-sensitive failures while still surfacing
  tool execution failures.
