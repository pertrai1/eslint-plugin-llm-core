# llm-core-quality

`llm-core-quality` is a small quality-gate CLI for projects that want to run
`eslint-plugin-llm-core`, ESLint, and Knip from one command and emit consistent
human, JSON, or SARIF output.

## Installation

Run it without installing:

```bash
npx llm-core-quality scan
npx llm-core-quality ci
```

Or install it in a project:

```bash
npm install --save-dev llm-core-quality
```

The CLI invokes the target project's local `eslint` and `knip` binaries when
they are available. Install and configure `eslint-plugin-llm-core` in the target
project when you want ESLint findings to include the `llm-core/*` rules.

## Quick Start

```bash
llm-core-quality scan
llm-core-quality scan --json
llm-core-quality scan --json --compact
llm-core-quality scan --sarif
llm-core-quality ci
```

Use `scan` during local or agent-driven investigation. Use `ci` when findings
should fail the command.

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

## Options

| Option               | Description                                                          |
| -------------------- | -------------------------------------------------------------------- |
| `--json`             | Print normalized JSON output.                                        |
| `--sarif`            | Print SARIF 2.1.0 output for code-scanning integrations.             |
| `--compact`          | Print compact JSON/SARIF instead of pretty-printed output.           |
| `--engine <engine>`  | Limit engines. Repeat or comma-separate `eslint` and `knip`.         |
| `--fail-on-findings` | Exit non-zero when findings are present.                             |
| `--no-exit-code`     | Exit zero for findings while still failing on tool execution errors. |
| `--color`            | Force colored text output.                                           |
| `--no-color`         | Disable colored text output.                                         |
| `-h`, `--help`       | Show CLI help.                                                       |

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

By default, the CLI invokes:

- ESLint with JSON formatting
- Knip with JSON reporting

Use `--engine eslint`, `--engine knip`, or `--engine eslint,knip` to limit the
engines for a run.

Engine commands are executed from the current working directory. ESLint receives
the supplied targets, or `.` when no targets are provided. Knip currently runs
against the project as a whole.

## Exit behavior

- `scan` exits zero for findings by default.
- `ci` exits non-zero for findings by default.
- `--fail-on-findings` forces finding-sensitive exit behavior.
- `--no-exit-code` suppresses finding-sensitive failures while still surfacing
  tool execution failures.

Tool execution failures still fail the command. For example, an invalid ESLint
configuration or a missing required dependency returns a non-zero exit code even
when `--no-exit-code` is set.

## CI Examples

Fail on findings and print a terminal report:

```bash
npx llm-core-quality ci
```

Generate SARIF for upload to a code-scanning tool:

```bash
npx llm-core-quality ci --sarif --compact > llm-core-quality.sarif
```

Run only ESLint over source and tests:

```bash
npx llm-core-quality ci --engine eslint src tests
```
