# MCP Success Metrics

This document defines how to measure the PRD success metrics for the MCP server
without adding product telemetry in v1.

## Token Reduction

Use an offline benchmark harness with a fixed set of representative editing
sessions. Each session records:

- `turnCount`: agent turns in the session.
- `staticInstructionTokens`: token count of `llm-core-instructions` output for
  the fixture ESLint config.
- `mcpInstructionTokens`: token count of guidance returned by MCP calls during
  the same session, including optional one-time `get_active_instructions`
  content if the scenario uses it.

Calculate:

```text
staticCost = staticInstructionTokens * turnCount
mcpCost = mcpInstructionTokens
tokenReduction = 1 - (mcpCost / staticCost)
```

The benchmark should report both totals and per-fixture values. Token counting
should use the same tokenizer as the target agent runtime when available; until
then, use a deterministic approximation and label it as an estimate.

## First-Attempt Self-Correction

Use the same fixture harness, seeded with files that intentionally violate one
or more `llm-core` rules.

For each violation:

1. Run `lint_file` and record `(file, ruleId, line, column, message)`.
2. Provide the returned `instruction` to the agent for one edit attempt.
3. Run `lint_file` again on the edited file.
4. Count the violation as corrected when the same `ruleId` no longer appears in
   that file after the first edit attempt.

Calculate:

```text
firstAttemptSelfCorrectionRate = correctedOnFirstAttempt / totalViolations
```

Report recurring violations separately from newly introduced violations. A
newly introduced violation is useful quality data, but it should not be counted
as the original violation failing to self-correct.

## V1 Scope

These metrics are benchmark-only in v1. Field telemetry is out of scope unless a
future release adds explicit opt-in collection and documentation.
