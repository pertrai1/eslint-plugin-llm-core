# llm-core/no-hallucinated-package-imports

📝 Disallow package imports and re-exports whose package root is not declared in the relevant package manifest.

💼 This rule is enabled in the 🌐 `all` config.

<!-- end auto-generated rule header -->

Disallow package `import` and `export ... from` declarations when the package root is not declared in the relevant package manifest.

## Rule Details

LLM coding agents often invent plausible package names, assume a dependency is already installed, or import from a package that exists in another project but not in the current one. These hallucinated package imports look reasonable during review but fail at install, build, test, or runtime.

This rule reports package roots that are absent from the configured package manifest dependency sources. It intentionally ignores relative and absolute local paths because `llm-core/no-hallucinated-local-imports` handles local modules.

By default, this rule treats these sources as allowed:

- `dependencies`
- `devDependencies`
- `peerDependencies`
- `optionalDependencies`
- Node.js builtins, including `node:` specifiers
- workspace package names discovered from simple `workspaces` patterns such as `packages/*`
- packages listed in the `allow` option

## Examples

### Incorrect

```ts
import { retry } from "super-retry-utils";
// super-retry-utils is not declared in package.json

import type { Client } from "@vendor/nonexistent-sdk";
// @vendor/nonexistent-sdk is not declared in package.json

export { thing } from "plausible-helper-package";
// plausible-helper-package is not declared in package.json

const mod = await import("made-up-package");
// made-up-package is not declared in package.json
```

### Correct

```ts
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
// zod is declared in package.json

import { helper } from "./helper";
// relative imports are handled by no-hallucinated-local-imports

import internal from "@workspace/internal-package";
// workspace package names are allowed when workspace discovery is enabled
```

## Options

```ts
type Options = [
  {
    packageJsonPath?: string;
    workspace?: boolean;
    allow?: string[];
    checkDevDependencies?: boolean;
    checkPeerDependencies?: boolean;
    checkOptionalDependencies?: boolean;
    checkDynamicImports?: boolean;
    checkRequire?: boolean;
  },
];
```

| Option                      | Default | Description                                                                  |
| --------------------------- | ------- | ---------------------------------------------------------------------------- |
| `packageJsonPath`           | nearest | Package manifest to inspect. If omitted, the nearest `package.json` is used. |
| `workspace`                 | `true`  | Allow workspace package names from simple workspace globs.                   |
| `allow`                     | `[]`    | Additional exact specifiers or package roots to allow.                       |
| `checkDevDependencies`      | `true`  | Treat `devDependencies` as allowed. Set to `false` to report them.           |
| `checkPeerDependencies`     | `true`  | Treat `peerDependencies` as allowed. Set to `false` to report them.          |
| `checkOptionalDependencies` | `true`  | Treat `optionalDependencies` as allowed. Set to `false` to report them.      |
| `checkDynamicImports`       | `true`  | Check dynamic `import("literal")` package specifiers.                        |
| `checkRequire`              | `false` | Check CommonJS `require("literal")` package specifiers.                      |

## What This Rule Flags

| Import/export shape                            | Flagged? |
| ---------------------------------------------- | -------- |
| `import { x } from "missing-package"`          | ✅ Yes   |
| `import type { X } from "@scope/missing"`      | ✅ Yes   |
| `export * from "missing-package/subpath"`      | ✅ Yes   |
| `import { x } from "declared-package/subpath"` | ❌ No    |
| `import { readFile } from "node:fs/promises"`  | ❌ No    |
| `import { helper } from "./helper"`            | ❌ No    |
| `await import(variableName)`                   | ❌ No    |
| `require("missing-package")` by default        | ❌ No    |

## Error Messages

The teaching message explains:

1. **What's wrong** — the imported package root is not declared in the relevant package manifest
2. **Why** — hallucinated package imports hide dependency changes and break install/build/test/runtime paths
3. **How to fix** — use an existing declared dependency, add the dependency intentionally, or configure an explicit allow/workspace entry
