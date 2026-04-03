# ESLint Rules for Type-First Enforcement

> How plugin rules can enforce type-driven development and teach agents the correct process

---

## The Enforcement Problem

| Mechanism           | Type                 | Agent Can Ignore?        |
| ------------------- | -------------------- | ------------------------ |
| CLAUDE.md directive | Behavioral guidance  | **Yes** — it's just text |
| TYPE_FIRST.md       | Behavioral guidance  | **Yes** — it's just text |
| TypeScript compiler | Technical constraint | No — code won't compile  |
| ESLint rule         | Technical constraint | No — code won't lint     |

**Behavioral guidance is advice. ESLint rules are law.**

---

## How a Rule Enforces Type-First

The pattern: An agent tries to implement code. ESLint rejects it. The error message teaches the agent what to do instead.

---

## Proposed Rules

### Rule 1: `require-type-annotation`

**What it enforces:** All exported functions must have explicit parameter and return types.

```typescript
// ❌ Agent writes this (no types)
export function processOrder(order) {
  return {
    id: order.id,
    status: "processed",
  };
}
```

**ESLint error:**

```
eslint-plugin-llm-core/require-type-annotation

Exported function 'processOrder' must have explicit type annotations.

Why: Without type annotations, TypeScript infers types from implementation.
This reverses the correct order: types should guide implementation, not describe it after.
For LLMs, explicit types reduce the solution space from millions to thousands.

How to fix:
1. First, define the types:
   type Order = { id: string; items: OrderItem[] };
   type ProcessedOrder = { id: string; status: string };

2. Then add type annotations to the function:
   export function processOrder(order: Order): ProcessedOrder { ... }
```

Agent sees this, defines types first, then implements.

---

### Rule 2: `require-interface-implementation`

**What it enforces:** Classes must implement an explicit interface.

```typescript
// ❌ Agent writes this (no interface)
export class UserRepository {
  async findById(id: string) {
    const row = await this.db.query("...");
    return row ? this.mapRow(row) : null;
  }
}
```

**ESLint error:**

```
eslint-plugin-llm-core/require-interface-implementation

Class 'UserRepository' must implement an explicit interface.

Why: Interfaces define the contract before implementation. This forces you to think
about the API surface independently from how it's built. For LLMs, the interface
acts as a constraint that guides implementation.

How to fix:
1. First, define the interface:
   interface UserRepository {
     findById(id: string): Promise<User | null>;
     create(data: UserInsert): Promise<User>;
   }

2. Then implement it:
   export class UserRepository implements UserRepository {
     async findById(id: string): Promise<User | null> { ... }
   }
```

---

### Rule 3: `no-any-parameter`

**What it enforces:** Function parameters cannot use `any`.

```typescript
// ❌ Agent writes this
export function validate(input: any): boolean {
  return input.value > 0;
}
```

**ESLint error:**

```
eslint-plugin-llm-core/no-any-parameter

Parameter 'input' uses 'any' type. Define an explicit type first.

Why: 'any' disables type checking entirely. It's an escape hatch that defeats
the purpose of type-driven development. The LLM solution space expands from
thousands to millions of implementations when 'any' is allowed.

How to fix:
1. Define what 'input' actually is:
   type ValidatorInput = { value: number; label?: string };

2. Use the explicit type:
   export function validate(input: ValidatorInput): boolean { ... }
```

---

### Rule 4: `no-implementation-before-type` (Advanced)

**What it enforces:** Functions cannot be exported from a file that has no type definitions.

This is a file-level constraint:

```typescript
// ❌ src/user-repository.ts
// No types defined in this file, but implementation exists

export class UserRepository {
  async findById(id: string) { ... }
}
```

**ESLint error:**

```
eslint-plugin-llm-core/no-implementation-before-type

File 'src/user-repository.ts' contains implementation but no type definitions.

Why: Type-first development requires defining types before implementation.
If this file has no types, the implementation was written without a type contract.

How to fix:
1. Create a types file: src/user-repository.types.ts
2. Define interfaces for UserRepository, User, UserInsert, etc.
3. Import and use those types in this file
4. Or co-locate types at the top of this file before any implementation
```

---

## Why This Teaches the Agent

The error messages follow a structured teaching format:

1. **What's wrong** — The specific violation
2. **Why it matters** — The rationale (type-first, solution space reduction)
3. **How to fix** — Concrete, copy-pasteable steps

The agent:

1. Tries to implement
2. Gets rejected by ESLint
3. Reads the teaching message
4. Defines types first
5. Implements against types
6. ESLint passes

**The loop is self-correcting.** The agent can't proceed until it follows the correct order.

---

## The Feedback Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Agent implements without types                                 │
│         │                                                       │
│         ▼                                                       │
│  ESLint rejects with teaching message                           │
│         │                                                       │
│         ▼                                                       │
│  Agent reads message, defines types                             │
│         │                                                       │
│         ▼                                                       │
│  Agent implements against types                                 │
│         │                                                       │
│         ▼                                                       │
│  ESLint passes                                                  │
│         │                                                       │
│         ▼                                                       │
│  Typescript compiles                                            │
│         │                                                       │
│         ▼                                                       │
│  Tests run                                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Each layer catches what the previous missed:

- **ESLint** → Enforces type-first structure
- **TypeScript** → Enforces type correctness
- **Tests** → Enforces behavioral correctness

---

## Rule Priority

| Rule                               | What It Enforces                          | Priority |
| ---------------------------------- | ----------------------------------------- | -------- |
| `require-type-annotation`          | Exported functions have explicit types    | P0       |
| `require-interface-implementation` | Classes implement interfaces              | P1       |
| `no-any-parameter`                 | No `any` in parameters                    | P0       |
| `no-any-return`                    | No `any` in return types                  | P0       |
| `no-implementation-before-type`    | Files with implementation must have types | P2       |

---

## How It Fits Existing Plugins

Existing rules catch LLM anti-patterns in _implementation_. These new rules catch LLM anti-patterns in _process_:

| Category         | Existing Rules                                             | Proposed Rules                                                |
| ---------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| **Code quality** | `no-empty-catch`, `no-magic-numbers`, `structured-logging` | —                                                             |
| **Structure**    | `no-exported-function-expressions`, `max-nesting-depth`    | —                                                             |
| **Process**      | —                                                          | `require-type-annotation`, `require-interface-implementation` |
| **Type safety**  | `no-any-in-generic`, `no-type-assertion-any`               | `no-any-parameter`, `no-any-return`                           |

The new rules ensure the agent _starts correctly_, not just that the result is correct.

---

## Summary

| Without ESLint Rules               | With ESLint Rules                        |
| ---------------------------------- | ---------------------------------------- |
| Agent _should_ define types first  | Agent _must_ define types first          |
| Behavioral guidance can be ignored | Technical constraint cannot be bypassed  |
| Error found at review              | Error found immediately                  |
| Agent learns slowly                | Agent learns from every rejected attempt |

The plugin becomes a **teaching enforcement layer** — not just catching mistakes, but enforcing the correct development process.

---

## Next Steps

1. Implement `require-type-annotation` as the first rule (P0)
2. Implement `no-any-parameter` and `no-any-return` (P0)
3. Implement `require-interface-implementation` (P1)
4. Consider `no-implementation-before-type` as an experimental rule (P2)

Each rule follows the same teaching format: what's wrong, why it matters, how to fix it.
