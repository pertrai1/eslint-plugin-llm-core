# llm-core/no-commented-out-code

📝 Disallow commented-out code to keep the codebase clean and reduce noise.

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Disallow commented-out code to keep the codebase clean and reduce noise.

## Rule Details

LLMs frequently leave commented-out code in their output — old implementations, "alternative approaches", half-removed logic, and abandoned experiments. This is one of the most recognizable LLM code smells. Commented-out code adds noise, creates confusion about intent, and makes files harder to read.

This rule detects comments that contain code-like patterns (variable declarations, function calls, control flow, imports/exports) and flags them for removal.

## Examples

### Incorrect

```ts
// const oldConfig = loadLegacyConfig();
// if (oldConfig.enabled) {
//   processLegacy(oldConfig);
// }
function loadConfig() {
  return getNewConfig();
}
```

```ts
/* const previousImplementation = async () => {
  const data = await fetchData();
  return transform(data);
}; */
async function fetchAndTransform() {
  return newApproach();
}
```

```ts
// import { oldHelper } from './utils';

// processData(items);

function main() {
  newProcess(items);
}
```

### Correct

```ts
// This function handles the new config loading approach
function loadConfig() {
  return getNewConfig();
}
```

```ts
// TODO: add caching support in next sprint
async function fetchAndTransform() {
  return newApproach();
}
```

```ts
/**
 * @param items - The items to process
 * @returns The processed result
 */
function main(items: Item[]) {
  return newProcess(items);
}
```

## What This Rule Allows

The following comment patterns are **not** flagged:

- **Prose comments** — explanations, notes, descriptions
- **TODO/FIXME/HACK/NOTE** — task markers
- **JSDoc comments** — documentation blocks starting with `/**`
- **ESLint directives** — `eslint-disable`, `eslint-enable`
- **TypeScript directives** — `@ts-expect-error`, `@ts-ignore`
- **URLs** — links to documentation or references
- **Short comments** — comments under 3 characters

## Detection Heuristic

The rule uses pattern matching to identify code in comments. It looks for:

- Variable declarations (`const`, `let`, `var`)
- Function and class declarations
- Import/export statements
- Control flow (`if`, `for`, `while`, `switch`, `try/catch`)
- Function/method calls ending with semicolons
- Assignments ending with semicolons
- `await` expressions
- `return`/`throw` statements

Consecutive line comments (`//`) on adjacent lines are grouped and analyzed together, catching multi-line commented-out code blocks.

## Error Messages

Error messages follow a structured teaching format designed for LLM self-correction:

1. **What's wrong** — identifies the commented-out code
2. **Why** — explains that git preserves history, making commented-out code unnecessary
3. **How to fix** — instructs to delete the code or link to the relevant commit
