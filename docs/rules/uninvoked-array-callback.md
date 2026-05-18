# llm-core/uninvoked-array-callback

📝 Disallow callbacks on sparse arrays created with Array(length) because holes skip callback invocation.

💼 This rule is enabled in the following configs: 🌐 `all`, 🏆 `best-practices`, ✅ `recommended`.

<!-- end auto-generated rule header -->

## Rule details

This rule flags array callback methods called directly on sparse arrays created with `Array(length)` or `new Array(length)`. Those constructors create holes, not present `undefined` elements. JavaScript array callback methods skip holes, so callbacks such as `.map(...)`, `.forEach(...)`, `.filter(...)`, `.some(...)`, and `.every(...)` may run zero times even though the code looks like it should run once per index.

LLMs often generate this pattern when they want to create `n` rows, placeholders, tasks, or test cases. The code silently returns another sparse array or performs no side effects.

Flagged patterns:

```ts
const rows = new Array(5).map((_, index) => createRow(index));

Array(count).forEach((_, index) => {
  save(index);
});

const ids = new Array(3).map((_, index) => index).filter((index) => index > 0);
```

Correct patterns:

```ts
const rows = Array.from({ length: 5 }, (_, index) => createRow(index));

new Array(count).fill(null).forEach((_, index) => {
  save(index);
});

const ids = [...new Array(3)]
  .map((_, index) => index)
  .filter((index) => index > 0);
```

## What counts as a sparse array callback

| Pattern                                 | Triggers? | Why                                                         |
| --------------------------------------- | --------- | ----------------------------------------------------------- |
| `new Array(5).map(callback)`            | Yes       | Length-only arrays contain holes, so callbacks are skipped. |
| `Array(count).forEach(callback)`        | Yes       | `Array(length)` has the same sparse-array behavior.         |
| `new Array(5).fill(null).map(callback)` | No        | `.fill(...)` materializes present elements first.           |
| `[...new Array(5)].map(callback)`       | No        | Spreading materializes present `undefined` elements.        |
| `Array.from({ length: 5 }, callback)`   | No        | `Array.from` invokes the mapping callback for each index.   |
| `new Array("a", "b").map(callback)`     | No        | Multiple arguments create present elements.                 |
| `collection.map(callback)`              | No        | The rule stays narrow and only targets Array constructors.  |

## Error messages

The error message teaches:

1. **What's wrong** — `Array(length)` created sparse slots, so the callback will not run for them.
2. **Why** — LLM-generated code often expects one callback invocation per index, but array methods skip holes.
3. **How to fix** — use `Array.from({ length }, mapper)` or materialize elements with `.fill(...)` before calling callback methods.
