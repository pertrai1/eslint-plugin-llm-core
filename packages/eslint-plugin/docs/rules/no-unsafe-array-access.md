# llm-core/no-unsafe-array-access

📝 Require a non-empty array guard before reading the first or last element.

💼 This rule is enabled in the following configs: 🌐 `all`, 🏆 `best-practices`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Require an explicit non-empty-array guard before reading the first or last element from an array.

LLM-generated code often handles the happy path (`items[0]`, `items[items.length - 1]`, or `const [first] = items`) but forgets the empty-array edge case. That produces `undefined`, which frequently becomes a follow-on crash when code immediately reads properties or calls methods on the value.

## Rule Details

This rule reports narrow, syntactic array access patterns that read a required element without proving that the array is non-empty:

- `items[0]`
- `items[items.length - 1]`
- `const [first] = items`
- `const [first, ...rest] = items`

The rule allows common guard patterns in the same control-flow path:

- `if (items.length > 0) { items[0] }`
- `if (items.length) { const [first] = items }`
- `if (items.length === 0) return; items[0]`
- `items.length !== 0 ? items[0] : fallback`
- `items.length && items[0]`

It also allows patterns that make the empty case explicit, such as destructuring defaults (`const [first = fallback] = items`) and optional element access (`items?.[0]`). Dynamic indexes such as `items[index]` are outside this rule's first/last-element scope.

## Examples

### Incorrect

```ts
// Empty arrays produce undefined, then the property read crashes.
const firstId = items[0].id;
```

```ts
// Empty arrays make length - 1 equal -1, so this reads undefined.
const latest = items[items.length - 1];
```

```ts
// The first element may be undefined when results is empty.
const [head, ...tail] = results;
```

### Correct

```ts
// Guard before reading the first element.
const first = items.length > 0 ? items[0] : undefined;
```

```ts
// Early-return guards make the later access safe.
if (items.length === 0) {
  return undefined;
}

const latest = items[items.length - 1];
```

```ts
// Destructuring defaults make the empty-array behavior explicit.
const [first = fallback] = items;
```

```ts
// Optional access intentionally returns undefined for absent values.
const maybeFirst = items?.[0];
```

## What Counts as Unsafe Array Access

| Pattern                                     | Triggers? |
| ------------------------------------------- | --------- |
| `items[0]`                                  | Yes       |
| `items[items.length - 1]`                   | Yes       |
| `const [first] = items`                     | Yes       |
| `const [first = fallback] = items`          | No        |
| `if (items.length > 0) { items[0] }`        | No        |
| `if (items.length === 0) return; items[0]`  | No        |
| `items.length !== 0 ? items[0] : undefined` | No        |
| `items?.[0]`                                | No        |
| `items[index]`                              | No        |
| `["fallback"][0]`                           | No        |

## Error Messages

The error message teaches:

1. **What's wrong** — the code reads a first or last array element without a non-empty guard
2. **Why** — empty arrays return `undefined`, which often causes crashes in follow-on code
3. **How to fix** — add a length guard, early-return on empty arrays, or provide an explicit fallback/default
