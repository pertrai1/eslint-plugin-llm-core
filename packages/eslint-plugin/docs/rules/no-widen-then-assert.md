# llm-core/no-widen-then-assert

📝 Disallow declaring a variable's type wider than its value, then asserting it back to the narrow type.

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`, ⌨️ `typescript`.

<!-- end auto-generated rule header -->

Disallow declaring a variable's type wider than its value, then asserting it back to the narrow type.

## Rule Details

LLMs sometimes resolve an unrelated type error by loosening a variable's declared type to `T | undefined` or `T | null`, then forcing it back to `T` with an `as` assertion or `!` at the point of use. Neither step fixes anything: the initializer never produced a nullish value, the variable is never reassigned, and the assertion just discards the annotation the code added a moment earlier. The result compiles, but it's a type contract that was never true in either direction.

This rule flags that specific round trip. It fires only when all of the following hold:

- The variable is declared with an explicit `T | undefined`, `T | null`, or `T | null | undefined` annotation.
- The initializer is a provably concrete value — a literal, template literal, object/array literal, `new` expression, or function/arrow expression — never a call whose result could genuinely be nullish.
- The variable is never reassigned anywhere in its scope.
- A later read of the variable is forced back to `T` via `as T`, `<T>`, or non-null `!`.

It intentionally does not use TypeScript's type checker, so it works without a `parserOptions.project` setup, matching every other rule in this plugin. It also intentionally skips `any`/`unknown` widening — that pattern is already covered by `no-type-system-bypass`.

## Examples

### Incorrect

```ts
let name: string | undefined = "Alice";
console.log(name as string);

let count: number | undefined = 0;
use(count!);
```

### Correct

```ts
// The type matches the value — no widening was added.
const name: string = "Alice";
console.log(name);

// The value is honestly nullable and handled with a check.
let name: string | undefined = maybeGetName();
console.log(name ?? "unknown");

// The variable is reassigned, so the wider type is doing real work.
let name: string | undefined = "Alice";
name = maybeClearName();
console.log(name as string);
```

## What Counts as Widen-Then-Assert

| Pattern                                                                                | Triggers? |
| -------------------------------------------------------------------------------------- | --------- |
| `let x: T \| undefined = <literal>; ...; x as T;`                                      | Yes       |
| `let x: T \| null = <literal>; ...; x!;`                                               | Yes       |
| `let x: T \| undefined = <literal>; ...; x = other(); ...; x as T;` (reassigned)       | No        |
| `let x: T \| undefined = someCall(); ...; x as T;` (initializer not provably concrete) | No        |
| `let x: T \| undefined = <literal>; ...; x ?? fallback;` (no assertion)                | No        |
| `let x: T \| any = <literal>; ...; x as T;` (`any`/`unknown` widening)                 | No        |

## Relationship to Nearby Rules

| Existing rule           | What it covers                                    | This rule avoids/reinforces                                         |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| `no-type-system-bypass` | `any` widening, `as unknown as T`, `!`, ts-ignore | Skips `any`/`unknown` widening so the two rules don't double-report |
| `no-type-assertion-any` | `value as any`                                    | Only concerns assertions back to the original concrete type         |

## Error Messages

The error message teaches:

1. **What's wrong** -- the variable was declared wider than its value, then forced back
2. **Why** -- the assertion fabricates evidence the compiler never had; the widening never reflected a real possibility
3. **How to fix** -- remove the added nullish member from the declaration, or handle real nullability with a check instead of an assertion
