# llm-core/no-incorrect-sort

📝 Disallow .sort() without a compare function, which coerces elements to strings and produces incorrect numeric ordering.

💼 This rule is enabled in the following configs: 🌐 `all`, 🏆 `best-practices`, ✅ `recommended`.

<!-- end auto-generated rule header -->

## Rule details

This rule flags `.sort()` calls that omit a compare function. JavaScript's default sort converts elements to strings before comparing, so `[10, 2, 1].sort()` produces `[1, 10, 2]` instead of `[1, 2, 10]`.

Flagged patterns:

```js
nums.sort(); // no compare function
arr.sort(undefined); // undefined is not a comparator
arr.sort(void 0); // void 0 is semantically undefined
```

Correct patterns:

```js
nums.sort((a, b) => a - b); // numeric ascending
names.sort((a, b) => a.localeCompare(b)); // locale-aware string
items.sort((a, b) => a.name.localeCompare(b.name)); // object property
```

## Scope and limitations

This rule operates on static AST analysis without type information. It:

- **Skips TypedArray receivers** — `new Int32Array([...]).sort()` is correct because `%TypedArray%.prototype.sort` uses numeric comparison by default.
- **Does not track variable types** — `const buffer = new Float64Array(data); buffer.sort();` will be flagged because the receiver is a plain identifier, not a `new` expression. For files with known TypedArray variables, disable the rule at the config level:
  ```js
  // eslint.config.mjs
  export default [
    { ignores: ["src/buffers/*.ts"] },
    // or: { files: ["src/buffers/*.ts"], rules: { "llm-core/no-incorrect-sort": "off" } },
  ];
  ```
- **May flag custom APIs** — Methods named `.sort()` on query builders, ORM cursors, or RxJS observables have no relation to `Array.prototype.sort`. Disable the rule in those scopes.
