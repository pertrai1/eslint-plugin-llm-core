# llm-core/filename-match-export

📝 Enforce that filenames match their single exported function, class, or component name.

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`, 🎨 `style`.

<!-- end auto-generated rule header -->

Enforce that filenames match their single exported function, class, or component name.

## Rule Details

LLMs frequently create files with names that don't match their contents (e.g., `utils.ts` exporting `UserService`). This rule enforces that when a file has exactly one export, the filename must match the export name.

Supported filename conventions:

- **Exact match** — `UserService.ts` exports `UserService`
- **kebab-case → camelCase** — `user-service.ts` exports `userService`
- **kebab-case → PascalCase** — `user-service.ts` exports `UserService`
- **PascalCase → camelCase** — `UserService.ts` exports `userService`

## Examples

### Incorrect

```ts
// account-service.ts — filename doesn't match export
export function UserService() {
  // ...
}

// getData.ts — filename doesn't match default export
export default function fetchData() {
  // ...
}

// Input.tsx — filename doesn't match component
export function Button() {
  return <button>Click</button>;
}
```

### Correct

```ts
// UserService.ts
export function UserService() {
  // ...
}

// user-service.ts — kebab-case matches PascalCase export
export function UserService() {
  // ...
}

// fetchData.ts
export default function fetchData() {
  // ...
}

// Button.tsx
export function Button() {
  return <button>Click</button>;
}
```

## What This Rule Does NOT Flag

- **`index.ts`** — barrel files have no single export to match
- **Files with multiple exports** — no single "primary" export to enforce
- **Test files** (`*.test.ts`, `*.spec.ts`) — test filenames follow their own conventions
- **Utility files** (`types.ts`, `constants.ts`, `enums.ts`, `errors.ts`, `utils.ts`, `helpers.ts`) — these contain multiple related items by convention
- **Re-exports** (`export { foo } from './foo'`) — passthrough, not authored content
- **Anonymous default exports** — no name to match against

## Error Messages

Error messages follow a structured teaching format designed for LLM self-correction:

1. **What's wrong** — identifies the filename and export that don't match
2. **Why** — explains that mismatched names hurt navigation and searchability
3. **How to fix** — suggests the expected filename based on the current naming convention
