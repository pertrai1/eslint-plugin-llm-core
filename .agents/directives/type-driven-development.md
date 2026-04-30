---
name: type-driven-development
description: Requires type and contract definition before implementation in typed projects or public API work.
version: 1.0.0
triggers:
  - types
  - public-api
  - typed-project
  - service-boundary
routing:
  load: conditional
---

# Type-First Development Directive

**When to load:** Load this directive before defining types for a new feature, module, or service boundary.

## ⚠️ MANDATORY: Type-First Development

You MUST define types before writing any implementation code. This is non-negotiable.

### The Rule

**No types = no code.**

Before implementing ANY function, class, or module:

1. **Check** — Do types/interfaces already exist for what you're building?
2. **Define** — If not, create type definitions FIRST in a `types.ts` file
3. **Verify** — Run the project's type-check command (for TypeScript projects, `tsc --noEmit`) to ensure types compile
4. **Confirm** — If introducing new type contracts with 5+ types or complex generics, ask the user to confirm the contract is correct
5. **Hand off** — Types are done. Proceed to the test-driven development cycle (RED/GREEN/REFACTOR)

### What This Means in Practice

#### ❌ WRONG: Implementation First

```typescript
// Don't do this
export function processOrder(order) {
  return {
    id: order.id,
    status: "processed",
    total: order.items.reduce((sum, item) => sum + item.price, 0),
  };
}
```

#### ✅ RIGHT: Types First

```typescript
// Step 1: Define types
export type OrderItem = {
  productId: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  items: OrderItem[];
  createdAt: Date;
};

export type ProcessedOrder = {
  id: string;
  status: "processed";
  total: number;
};

export function processOrder(order: Order): ProcessedOrder;

// Implementation comes later via test-driven development
// Shown here for completeness only:
export function processOrder(order: Order): ProcessedOrder {
  return {
    id: order.id,
    status: "processed",
    total: order.items.reduce((sum, item) => sum + item.price, 0),
  };
}
```

### Required Type Elements

Always define:

1. **Domain types** — The core data structures (User, Order, Post, etc.)
2. **Input types** — What goes in (UserInsert, OrderCreate, etc.)
3. **Output types** — What comes out (User, ProcessedOrder, etc.)

Define as applicable:

4. **Error types** — For operations that can fail (discriminated unions for public APIs)
5. **Interface contracts** — For services, repositories, or collaborators that need a boundary

### Error Handling Pattern

Prefer discriminated unions for public APIs and service boundaries:

```typescript
// For public APIs and service boundaries, prefer discriminated unions:
type FindUserResult =
  | { success: true; user: User }
  | { success: false; error: "not-found" | "access-denied" };

function findUser(id: string): Promise[FindUserResult];

// For internal helpers, `| null` is acceptable when the meaning is unambiguous:
function describeKind(node: Expression): string | null;
```

### Forbidden Patterns

| Pattern                                | Why It's Forbidden                           |
| -------------------------------------- | -------------------------------------------- |
| `any` type                             | Defeats type safety, infinite solution space |
| Implicit `any`                         | Same problem, hidden                         |
| `Function` type                        | Too permissive, no contract                  |
| Returning `null` without explicit type | Ambiguous error handling                     |
| Throwing without return type change    | Hides failure modes                          |

### Quality Gate

Before types are considered complete:

```bash
# Must pass the project's type check
# For TypeScript projects, example:
npx tsc --noEmit
```

After implementation (via TDD), all gates must pass:

```text
Run the project's full quality-gate command suite (test, lint, build/type-check)
```

If any fail, the implementation is incomplete.

### When Types Are Complex

If a type contract is non-trivial (5+ types, complex unions, generics), present the types to the user BEFORE implementing:

```
I've defined the type contract for [feature]. Please confirm this matches your intent:

[Show types]

Once confirmed, I'll implement against these types.
```

---

## Quick Reference

| Step | Action               | Command                                                                   |
| ---- | -------------------- | ------------------------------------------------------------------------- |
| 1    | Define types         | Create/edit the project's type definitions file (for example, `types.ts`) |
| 2    | Verify types         | Run the project's type-check command (for TypeScript, `npx tsc --noEmit`) |
| 3    | Confirm (if complex) | Present types to user                                                     |
| 4    | Hand off to TDD      | Proceed to the test-driven development cycle (RED/GREEN/REFACTOR)         |

---

_After types are verified, proceed to test-driven development. Do not implement without tests._
