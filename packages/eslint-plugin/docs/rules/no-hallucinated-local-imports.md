# llm-core/no-hallucinated-local-imports

📝 Disallow static relative imports and re-exports that reference missing local modules or named exports.

💼 This rule is enabled in the 🌐 `all` config.

<!-- end auto-generated rule header -->

Disallow static relative `import` and `export ... from` declarations that point to missing local modules or request named exports that the target module does not directly export.

## Rule Details

LLM coding agents often invent nearby file names or helper export names that sound plausible in the current codebase. These hallucinated imports are high-signal failures: the code usually cannot build, type-check, or run.

This rule is intentionally narrow for v1:

- checks only relative local paths that start with `./` or `../`
- checks only static `import` declarations and `export ... from` re-exports
- resolves explicit files, common JS/TS extensions, and `index` files
- checks direct named exports in the resolved module
- ignores package imports, path aliases, dynamic imports, and re-export chains

## Examples

### Incorrect

```ts
import { createCache } from "./cache-utils";
// ./cache-utils does not resolve to a local file

import { createCacheFactory } from "./cache";
// ./cache exists, but it does not directly export createCacheFactory

export { parseUser } from "../users/parser";
// ../users/parser exists, but parseUser is not directly exported there
```

### Correct

```ts
import { createCache } from "./cache";
import { parseUserRecord } from "../users/parser";
export { createCache } from "./cache";
```

## What This Rule Flags

| Import/export shape                        | Flagged? |
| ------------------------------------------ | -------- |
| `import { x } from "./missing"`            | ✅ Yes   |
| `export { x } from "./missing"`            | ✅ Yes   |
| `import { missing } from "./existing"`     | ✅ Yes   |
| `import { existing } from "./existing"`    | ❌ No    |
| `import pkg from "package"`                | ❌ No    |
| `import("./missing")`                      | ❌ No    |
| `import { x } from "@/aliased/module"`     | ❌ No    |
| indirect export through a barrel/re-export | ❌ No    |

## Error Messages

The teaching messages explain:

1. **What's wrong** — names the import path and, for a missing binding, the name that was requested
2. **Why** — hallucinated imports are a common LLM failure mode that break builds
3. **How to fix** — lists what does exist so the fix is a choice, not a search: the target module's direct named exports, or the modules in the target directory when the path does not resolve

For example:

```text
'./cache' has no export named 'createCacheFactory'.
...
How to fix:
  Named exports available in './cache': clearCache, createCache
  Import one of those names, or add 'createCacheFactory' to the module intentionally.
```

Lists are sorted and capped at 20 entries. Only direct exports are listed; names reachable through `export * from` are not.
