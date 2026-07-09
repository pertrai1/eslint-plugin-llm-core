# llm-core/max-complexity

📝 Enforce a maximum cyclomatic complexity per function to encourage decomposition.

💼 This rule is enabled in the following configs: 🌐 `all`, 🧮 `complexity`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Enforce a maximum cyclomatic complexity per function to encourage decomposition.

## Rule Details

LLM-generated code often accumulates `if` chains, loops, logical shortcuts, and optional-chaining branches in a single function because each step looks locally reasonable. The result is code with too many independent execution paths to test or modify safely.

This rule matches ESLint's core `complexity` rule in classic mode:

- Base complexity starts at `1`
- Each `if`, `else if`, loop, `catch`, ternary, logical expression, non-default `switch` case, default parameter, logical assignment, optional member access, and optional call adds `1`
- Complexity resets for each function, class field initializer, and class static block

## Examples

### Incorrect

```ts
function getValue(type: string): number {
  if (type === "a") return 1;
  if (type === "b") return 2;
  if (type === "c") return 3;
  if (type === "d") return 4;
  if (type === "e") return 5;
  if (type === "f") return 6;
  if (type === "g") return 7;
  if (type === "h") return 8;
  if (type === "i") return 9;
  if (type === "j") return 10;
  return 11;
}
```

```ts
class Workflow {
  handle(step: number): number {
    if (step === 1) return 1;
    if (step === 2) return 2;
    if (step === 3) return 3;
    return 4;
  }
}
```

### Correct

```ts
const VALUES: Record<string, number> = {
  a: 1,
  b: 2,
  c: 3,
  d: 4,
};

function getValue(type: string): number {
  return VALUES[type] ?? 0;
}
```

```ts
function handleWorkflow(step: number): number {
  if (step <= 0) return 0;

  return lookupStepValue(step);
}

function lookupStepValue(step: number): number {
  const STEP_VALUES: Record<number, number> = { 1: 1, 2: 2, 3: 3 };
  return STEP_VALUES[step] ?? 4;
}
```

## Options

### `max`

Maximum allowed cyclomatic complexity. Default: `10`.

```json
{ "llm-core/max-complexity": ["error", { "max": 8 }] }
```

### `skipTestFiles`

Skips `*.test.*` and `*.spec.*` files. Default: `true`.

```json
{ "llm-core/max-complexity": ["error", { "skipTestFiles": false }] }
```

## Error Messages

The message is intentionally prescriptive:

- It reports the function or code-path boundary name, current complexity, and configured maximum
- It explains why each additional branch makes the function riskier to change
- It demonstrates a concrete rewrite from branching logic to a lookup table

## Decomposition Strategies

When this rule fires, start with the smallest rewrite that removes branching paths without obscuring intent:

1. **Lookup tables** — replace repeated equality branches with a data structure
2. **Guard clauses** — exit early so the main path stays flat
3. **Function extraction** — move a cohesive branch cluster into a named helper
4. **Strategy pattern** — route behavior through an object of handlers when branching selects an algorithm

## Complementary Tools

- [`no-nested-ternary`](https://eslint.org/docs/latest/rules/no-nested-ternary) — prevents dense conditional expressions from hiding branching
- [`no-useless-assignment`](https://eslint.org/docs/latest/rules/no-useless-assignment) — catches temporary variables that often appear during branch-heavy rewrites
- [`max-nesting-depth`](./max-nesting-depth.md) — limits how deep branching stacks once you have already reduced path count
