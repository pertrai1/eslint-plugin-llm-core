# llm-core/explicit-export-types

📝 Require explicit parameter and return type annotations on exported functions.

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Require explicit parameter and return type annotations on all exported functions, including function declarations, arrow functions, and function expressions.

## Rule Details

LLMs frequently omit type annotations on exported functions, letting TypeScript infer types from the implementation. This reverses the correct order: types should define the contract _before_ the implementation is written. Without explicit annotations, the type contract is an accidental by-product of the code rather than a deliberate specification.

This rule applies only to **exported** functions. Internal helpers and non-exported functions are not flagged — they are implementation details whose types are constrained by the callers that use them.

## Examples

### Incorrect

```ts
// ❌ Missing return type — TypeScript infers from implementation
export function processOrder(order: Order) {
  return { id: order.id, status: "processed" };
}

// ❌ Missing parameter type — TypeScript cannot check callers
export function validate(input): boolean {
  return input.value > 0;
}

// ❌ Both missing — no contract at all
export const handler = (req) => req.body;

// ❌ Default export missing return type
export default function handle(req: Request) {
  return req.body;
}
```

### Correct

```ts
// ✅ Both parameter and return types explicit
export function processOrder(order: Order): ProcessedOrder {
  return { id: order.id, status: "processed" };
}

// ✅ Arrow function with full annotations
export const validate = (input: ValidatorInput): boolean => {
  return input.value > 0;
};

// ✅ No params — return type still required
export function ping(): void {}

// ✅ Destructured param with type annotation on the pattern
export function greet({ name }: User): string {
  return `Hello ${name}`;
}

// ✅ Default param with explicit type
export function retry(times: number = 3): void {}
```

## What This Rule Catches

The rule flags exported functions missing:

1. **Return type annotation** — `export function foo(x: string) { ... }` (return type inferred)
2. **Parameter type annotation** — `export function foo(x): string { ... }` (param type implicit)

Covered export forms:

- `export function foo(...)` — named function declaration
- `export default function foo(...)` — default function declaration
- `export const foo = (...) => ...` — arrow function on exported const
- `export const foo = function(...) { ... }` — function expression on exported const

### What This Rule Does NOT Catch

- Non-exported functions — `function internal(x) { return x; }` — internal helpers are not flagged
- Typed destructuring — `export function foo({ id }: User): void {}` — the pattern has a type annotation
- Typed rest params — `export function foo(...args: string[]): void {}` — already annotated
- Default params with explicit types — `export function foo(x: number = 0): string { ... }` — fine

### Known Limitations

Two indirect export patterns are not checked because they require scope traversal to resolve:

1. **Specifier exports** — `function foo(x) {} export { foo };` — the function is defined separately and exported via a specifier. The rule only checks inline `export function` declarations.

2. **Identifier default exports** — `const fn = (x) => x; export default fn;` — the default export is a reference, not an inline function. The rule only checks `export default function` and `export default () =>` forms.

Both are false negatives. They can be addressed in a follow-up by adding scope-aware analysis.

## Why This Matters for LLMs

Without explicit type annotations on exported functions, an agent:

- Cannot verify that callers are passing the right shape before running the code
- May change the return structure without realising it breaks the type contract
- Has an unbounded solution space — any return shape is valid when the type is inferred

With explicit annotations, the TypeScript compiler enforces the contract. The agent must define the types first, which forces it to reason about the API before implementing it.

## Relationship to `@typescript-eslint` Rules

`@typescript-eslint/explicit-function-return-type` and `@typescript-eslint/explicit-module-boundary-types` cover similar ground but are not enabled in `recommended`. This rule fills that gap with LLM-specific error messages that teach the correct process: define types first, then implement against them.

## Error Messages

Each error message follows a structured teaching format:

1. **What's wrong** — the specific missing annotation
2. **Why it matters** — why type-first development requires explicit annotations
3. **How to fix** — concrete steps: define a type, then annotate the function
