# Disallow type assertions to `any` that bypass TypeScript's type safety (`llm-core/no-type-assertion-any`)

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Disallow type assertions to `any` (`as any` and `<any>` syntax).

## Rule Details

LLMs reach for `as any` as the default escape hatch when types don't align. This completely disables TypeScript's type checking at the assertion site and for every downstream usage of the value. It is the single most common way generated code defeats type safety.

## Examples

### Incorrect

```ts
// Bypasses all type checking
const result = data as any;

// Silently accesses potentially nonexistent property
(response as any).body;

// Hides a type incompatibility
process(input as any);

// Angle bracket syntax (same problem)
const value = <any>data;
```

### Correct

```ts
// Assert to a specific known type
const result = data as ExpectedType;

// Double assertion through unknown (explicit escape hatch)
const result = data as unknown as ExpectedType;

// Use unknown and narrow with type guards
function process(data: unknown) {
  if (typeof data === "string") {
    handle(data); // TypeScript knows it's a string
  }
}

// Properly type the response
const body = (response as ResponseWithBody).body;
```

## What This Rule Catches

The rule flags both forms of type assertion to `any`:

1. **`as any`** — `value as any`
2. **`<any>`** — `<any>value` (angle bracket syntax)

### What This Rule Does NOT Catch

- `any` in type annotations (`const x: any`) — use `@typescript-eslint/no-explicit-any` for this
- `any` in generic type arguments (`Array<any>`) — use `llm-core/no-any-in-generic` for this
- Implicit `any` from missing type annotations — use `@typescript-eslint/no-unsafe-*` rules for this

## Error Messages

The error message teaches the proper alternative:

1. **What's wrong** — the assertion bypasses all type checking
2. **Why** — `any` disables TypeScript's safety and leaks into downstream code
3. **How to fix** — assert to a specific type, or use `unknown` with type guards
