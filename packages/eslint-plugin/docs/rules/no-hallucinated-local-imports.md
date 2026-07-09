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

1. **What's wrong** — the local module path or named export does not exist
2. **Why** — hallucinated imports are a common LLM failure mode that break builds
3. **How to fix** — update the import to an existing local module/export, or add the missing export intentionally
