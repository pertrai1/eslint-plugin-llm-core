# llm-core/bad-min-max-func

📝 Disallow inverted nested Math.min/Math.max clamps that always return a constant bound.

💼 This rule is enabled in the following configs: 🌐 `all`, 🏆 `best-practices`, ✅ `recommended`.

<!-- end auto-generated rule header -->

## Rule details

This rule flags nested `Math.min`/`Math.max` clamp expressions whose numeric literal bounds are inverted. These expressions look like they constrain a value to a range, but they actually collapse to a constant bound.

LLMs often generate clamp logic while normalizing percentages, limits, scores, or UI coordinates. When the lower and upper bounds are swapped, the code still typechecks and looks plausible while silently discarding the input value.

Flagged patterns:

```ts
const clamped = Math.min(Math.max(value, 100), 0);
const clamped = Math.min(Math.max(100, value), 0);
const clamped = Math.max(Math.min(value, 0), 100);
```

Correct patterns:

```ts
const clamped = Math.min(Math.max(value, 0), 100);
const clamped = Math.max(Math.min(value, 100), 0);
```

## What counts as an inverted clamp

| Pattern                                   | Triggers? | Why                                                            |
| ----------------------------------------- | --------- | -------------------------------------------------------------- |
| `Math.min(Math.max(value, 100), 0)`       | Yes       | The inner value is at least `100`; the outer call returns `0`. |
| `Math.max(Math.min(value, 0), 100)`       | Yes       | The inner value is at most `0`; the outer call returns `100`.  |
| `Math.min(Math.max(value, 0), 100)`       | No        | Lower and upper bounds are ordered correctly.                  |
| `Math.max(Math.min(value, 100), 0)`       | No        | Alternate clamp spelling with ordered bounds.                  |
| `Math.min(Math.max(value, 100), 100)`     | No        | Equal bounds intentionally collapse to one fixed value.        |
| `Math.min(Math.max(value, lower), upper)` | No        | Computed bounds are outside this narrow syntactic scope.       |
| `min(max(value, 100), 0)`                 | No        | Non-`Math` helpers may implement different semantics.          |

## Error messages

The error message teaches:

1. **What's wrong** — the nested `Math.min`/`Math.max` clamp has inverted numeric bounds and always returns a constant.
2. **Why** — LLM-generated clamp code can swap lower and upper bounds, preserving plausible syntax while discarding the input value.
3. **How to fix** — put the lower bound in `Math.max` and the upper bound in `Math.min`, or use the equivalent `Math.max(Math.min(value, upper), lower)` ordering.
