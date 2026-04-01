# no-exported-function-expressions

Enforce that exported functions use function declarations instead of function expressions or arrow functions.

## Rationale

LLMs consistently default to `export const fn = () => {}` when generating code. Function declarations are preferred because:

- **Hoisting**: Function declarations are hoisted, making code order more flexible
- **Stack traces**: Named function declarations produce clearer stack traces for debugging
- **Intent**: Declarations signal "this is a named function" more clearly than variable assignments
- **Consistency**: Enforces a single style across the codebase

This rule provides structured error messages that teach the LLM the correct pattern. Through iteration, the LLM learns to use function declarations automatically.

## Rule Details

This rule reports when:

1. A named export uses an arrow function or function expression (`export const fn = () => {}`)
2. A default export uses an anonymous arrow function (`export default () => {}`)
3. A default export uses an anonymous function expression (`export default function() {}`)

### What This Rule Catches

| Pattern                                  | Caught?    |
| ---------------------------------------- | ---------- |
| `export const fn = () => {}`             | Yes        |
| `export const fn = async () => {}`       | Yes        |
| `export const fn = function() {}`        | Yes        |
| `export const fn = async function() {}`  | Yes        |
| `export default () => {}`                | Yes        |
| `export default function() {}`           | Yes        |
| `export function fn() {}`                | No (valid) |
| `export default function fn() {}`        | No (valid) |
| `const fn = () => {}` (non-exported)     | No (valid) |
| `export const value = 42` (non-function) | No (valid) |

## Examples

### Incorrect

```ts
// Arrow function exports
export const fetchData = async () => {
  return await api.get('/data');
};

// Function expression exports
export const processItem = function(item) {
  return item.value * 2;
};

// Anonymous default exports
export default () => <div>Hello</div>;

// Expression body arrows
export const double = (x: number) => x * 2;
```

### Correct

```ts
// Named function declarations
export async function fetchData() {
  return await api.get('/data');
}

export function processItem(item) {
  return item.value * 2;
}

// Named default export
export default function HelloComponent() {
  return <div>Hello</div>;
}

export function double(x: number) {
  return x * 2;
}

// Non-exported arrow functions are fine (internal helpers)
const helper = () => 'internal';
```

## Suggestions

This rule provides manual fix suggestions (not auto-fix) to convert function expressions to declarations. Auto-fix is intentionally avoided because converting arrow functions to declarations can change `this` binding semantics in some contexts.

## No Escape Hatches

Following the [deterministic linting approach](https://understandingdata.com/posts/custom-eslint-rules-determinism/), this rule is designed to be used alongside `eslint-comments/no-use` or similar rules that prevent `eslint-disable` comments. This ensures LLM agents cannot bypass the rule and must learn the correct pattern.

## Error Message Format

Error messages follow a structured teaching format:

1. **What's wrong**: Clear statement of the violation
2. **Why**: Explanation of why the pattern is preferred
3. **How to fix**: Concrete before/after code example

This format is designed to be parseable by LLMs, enabling self-correction through the lint-fix loop.
