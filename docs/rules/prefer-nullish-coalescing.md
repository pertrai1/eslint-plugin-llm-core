# llm-core/prefer-nullish-coalescing

📝 Prefer nullish coalescing over logical OR when providing default values.

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`, 🎨 `style`.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Prefer `??` over `||` when providing fallback values so valid falsy values are preserved.

## Rule Details

`||` treats `0`, `""`, and `false` as missing values. When code is selecting a default value, `??` is usually safer because it only falls back for `null` or `undefined`.

This rule uses syntax-only heuristics. It reports likely default-value expressions and intentionally skips common boolean logic patterns, including boolean contexts and boolean-like names such as `isReady`, `hasAccess`, or `canRetry`.

## Examples

### Incorrect

```ts
const name = input || "Unknown";
const count = value || 10;
options.timeout = options.timeout || 5000;
return cachedValue || computeDefault();
```

### Correct

```ts
const name = input ?? "Unknown";
const count = value ?? 10;
options.timeout = options.timeout ?? 5000;
return cachedValue ?? computeDefault();
```

### Not Reported

```ts
if (isReady || isForced) {
  run();
}

return flags.isReady || computeDefault();
const enabled = config.enabled || false;
const value = input || cached || "fallback";
```

## Limitations

This rule does not use type information. It avoids some obvious boolean false positives, but it cannot know the runtime type of every expression. It also skips chained logical expressions where a safe suggestion would require restructuring parentheses or converting the whole chain.
