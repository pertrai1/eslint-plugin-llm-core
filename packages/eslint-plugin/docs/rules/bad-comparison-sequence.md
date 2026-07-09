# llm-core/bad-comparison-sequence

📝 Disallow chained equality and comparison expressions that compare an intermediate boolean result.

💼 This rule is enabled in the following configs: 🌐 `all`, 🏆 `best-practices`, ✅ `recommended`.

<!-- end auto-generated rule header -->

## Rule details

This rule flags chained JavaScript/TypeScript comparisons such as `0 <= ratio <= 1` and `a === b === c`. JavaScript evaluates these expressions left-to-right, so the first comparison produces a boolean and the second comparison uses that boolean as an operand.

LLMs often generate this pattern when translating mathematical range notation directly into code. The result looks reasonable but silently checks the wrong condition.

Flagged patterns:

```ts
if (0 <= ratio <= 1) {
  accept(ratio);
}

const inside = min < value < max;

if ((a === b) === c) {
  sync();
}
```

Correct patterns:

```ts
if (0 <= ratio && ratio <= 1) {
  accept(ratio);
}

const inside = min < value && value < max;

if (a === b && b === c) {
  sync();
}
```

## What counts as a bad comparison sequence

| Pattern                    | Triggers? | Why                                                                |
| -------------------------- | --------- | ------------------------------------------------------------------ |
| `0 <= value <= 1`          | Yes       | The second comparison compares the boolean result of `0 <= value`. |
| `min < value < max`        | Yes       | JavaScript does not support mathematical chained comparisons.      |
| `a === b === c`            | Yes       | The final equality compares `(a === b)` to `c`.                    |
| `0 <= value && value <= 1` | No        | Each comparison explicitly checks the intended value.              |
| `(a < b) === true`         | No        | Explicit boolean checks are outside this rule's narrow scope.      |
| `score > threshold`        | No        | Single comparisons are valid.                                      |

## Error messages

The error message teaches:

1. **What's wrong** — the chained comparison does not behave like mathematical notation.
2. **Why** — JavaScript evaluates left-to-right and compares an intermediate boolean result.
3. **How to fix** — split the chain into explicit comparisons joined with `&&`.
