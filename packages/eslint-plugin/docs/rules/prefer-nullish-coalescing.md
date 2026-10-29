# llm-core/prefer-nullish-coalescing

📝 Prefer nullish coalescing over logical OR when providing default values.

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`, 🎨 `style`.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Prefer `??` over `||` when providing fallback values so valid falsy values are preserved.

## Rule Details

`||` treats `0`, `""`, and `false` as missing values. When code is selecting a default value, `??` is usually safer because it only falls back for `null` or `undefined`.

This rule uses syntax-only heuristics. It reports likely default-value expressions and intentionally skips common boolean logic patterns, including boolean contexts and boolean-like names such as `isReady`, `hasAccess`, or `canRetry`.

It also recognizes `Set.has`, `RegExp.test`, and `String.endsWith` when syntax and scope establish the built-in receiver. Supported receivers include direct `new Set(...)`, `new RegExp(...)`, `new String(...)`, regular-expression/string/template literals, and earlier `const` bindings to them. Constructors must be unshadowed. Object receivers must be used only for calls to the relevant predicate; reassignment, method replacement, passing the object elsewhere, and alias escapes prevent proof. Primitive strings are immutable and can be used elsewhere.

This applies to both variable initializers and return statements. Arbitrary methods named `has`, `test`, or `endsWith` are not assumed to return booleans.

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

const knownNames = new Set();
const suffixPattern = /_token$/;
const name = "custom_token";
const matches = knownNames.has(name) || suffixPattern.test(name);
const technical = knownNames.has(name) || name.endsWith("_trace_id");
```

## Limitations

This rule does not use type information. It avoids some obvious boolean false positives, but it cannot know the runtime type of every expression. It also skips chained logical expressions where a safe suggestion would require restructuring parentheses or converting the whole chain.

Built-in recognition assumes standard, unmodified built-in prototypes. Unknown parameters, computed methods, optional calls, aliases to constructors/objects, and object receivers with other uses remain outside that conservative proof.
