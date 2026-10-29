# llm-core/no-redundant-logic

📝 Disallow redundant boolean logic and unnecessary control flow patterns.

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`, 🎨 `style`.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Flags four patterns where LLMs produce verbose-but-correct boolean logic that can be simplified without changing semantics.

## Rule Details

### Pattern 1 — Redundant boolean comparison

Explicit `=== true`, `!== true`, `=== false`, or `!== false` comparisons on an expression that already evaluates to a boolean.

Only strict equality (`===`/`!==`) is flagged. Loose equality (`==`/`!=`) has different truthy/falsy semantics and is intentionally excluded.

The operand must be provably boolean from syntax: a boolean literal, a negation, a comparison, a logical expression with boolean operands, or a `const` initialized from one of these expressions. Names such as `isActive`, type annotations, and type assertions are not proof. Unknown inputs and properties retain their strict comparisons, including outside conditional tests.

Calls do not establish a boolean return type, including native-looking predicates such as `Set.has`, `RegExp.test`, and `String.endsWith`: their methods and prototypes can be replaced. Strict comparisons on calls are preserved. Negation and comparison operators still guarantee boolean results. Expressions inside dynamic `with` scopes are excluded from proof.

#### Incorrect

```ts
const isActive = status === "active";
const isValid = errors.length === 0;
const hasPermission = permissions.length > 0;
const running = !stopped;

if (isActive === true) {
}
if (isValid !== true) {
}
if (hasPermission === false) {
}
while (running !== false) {}
```

#### Correct

```ts
if (isActive) {
}
if (!isValid) {
}
if (!hasPermission) {
}
while (running) {}

// These checks distinguish literal booleans from other falsy/truthy values.
const rejectsAll = schema === false;
const nullable = schema.nullable === true;
```

### Pattern 2 — Unnecessary else after return/throw

An `else` block that follows an `if` block ending in `return` or `throw` is unreachable via fall-through. The `else` can be removed and its body placed at the outer scope.

Only flags when:

- The `if` consequent ends with `return` or `throw`
- The `else` is a simple block (single `return` or `throw`), not an `else if` chain
- Pattern 4 does not apply to the same node (to avoid double-reporting)

#### Incorrect

```ts
function getLabel(status: string): string {
  if (status === "active") {
    return "Active";
  } else {
    return "Inactive";
  }
}
```

#### Correct

```ts
function getLabel(status: string): string {
  if (status === "active") {
    return "Active";
  }
  return "Inactive";
}
```

### Pattern 3 — Ternary returning boolean literals

A ternary of the form `condition ? true : false` or `condition ? false : true` is identical to the condition (or its negation).

#### Incorrect

```ts
const isEligible = age >= 18 ? true : false;
const isBlocked = isAdmin ? false : true;
```

#### Correct

```ts
const isEligible = age >= 18;
const isBlocked = !isAdmin;
```

### Pattern 4 — If/else returning or assigning boolean literals

When both branches of an `if`/`else` exclusively `return` or assign the same variable to a boolean literal, the entire construct reduces to a single expression.

#### Incorrect

```ts
if (items.length > 0) {
  return true;
} else {
  return false;
}

let isValid;
if (age >= 18) {
  isValid = true;
} else {
  isValid = false;
}
```

#### Correct

```ts
return items.length > 0;
const isValid = age >= 18;
```

## Out of Scope

- De Morgan transformations (`!(a && b)` → `!a || !b`) — too subjective
- `!!value` double-negation — intentional type-coercion pattern
- Loose equality (`== true`) — different semantics
- Complex boolean simplification — requires symbolic reasoning

## Error Messages

Each pattern has a distinct `messageId`:

| Pattern | `messageId`                  |
| ------- | ---------------------------- |
| 1       | `redundantBooleanComparison` |
| 2       | `unnecessaryElse`            |
| 3       | `ternaryBooleanLiteral`      |
| 4       | `ifElseBooleanLiteral`       |

All four messages follow the standard what/why/how format.

## Suggestions

All four patterns provide suggestions (not auto-fixes) — the transformations are safe but the developer should confirm intent before applying.
