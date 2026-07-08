# llm-core/no-type-system-bypass

📝 Disallow broad TypeScript escape hatches that hide type errors instead of fixing them.

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`, ⌨️ `typescript`.

<!-- end auto-generated rule header -->

Disallow broad TypeScript escape hatches that silence the compiler instead of fixing the type model.

## Rule Details

LLMs commonly resolve TypeScript errors by adding suppression comments, double assertions, non-null assertions, or explicit `any` annotations. These patterns make code compile while removing the compiler evidence that would have caught a real bug.

This rule complements narrower rules such as `no-type-assertion-any`, `no-any-in-generic`, and `prefer-unknown-in-catch` by catching additional high-risk bypasses:

- `@ts-ignore`
- unexplained or generic `@ts-expect-error`
- double assertions through `unknown`
- non-null assertions (`!`)
- explicit `any` annotations outside `as any` assertions and catch parameters

## Examples

### Incorrect

```ts
// @ts-ignore
callLibrary({ experimental: true });

// @ts-expect-error
callLibrary({ experimental: true });

const user = data as unknown as User;
const name = user!.profile.name;
let payload: any = loadPayload();
function handle(payload: any): void {
  process(payload);
}
```

### Correct

```ts
// @ts-expect-error TS2345: upstream package types reject documented runtime option
callLibrary({ experimental: true });

const user = UserSchema.parse(data);
if (!user.profile) {
  throw new Error("User profile is required");
}

const payload: unknown = loadPayload();
if (isPayload(payload)) {
  process(payload);
}
```

## Relationship to Nearby Rules

| Existing rule             | What it covers                     | This rule avoids/reinforces                                |
| ------------------------- | ---------------------------------- | ---------------------------------------------------------- |
| `no-type-assertion-any`   | `value as any` and `<any>value`    | Does not duplicate those assertion reports                 |
| `no-any-in-generic`       | `Array<any>`, `Promise<any>`, etc. | Does not duplicate generic type argument reports           |
| `prefer-unknown-in-catch` | `catch (error: any)`               | Skips catch parameters so the focused rule can report them |

## Error Messages

The error messages teach:

1. **What's wrong** -- the code suppresses or bypasses TypeScript's checks
2. **Why** -- LLMs often use these patterns to hide compiler errors rather than resolving contracts
3. **How to fix** -- use specific types, `unknown` plus narrowing, runtime guards, schemas, or justified `@ts-expect-error` comments
