import path from "node:path";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-hallucinated-package-imports";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();
const fixtureRoot = path.join(
  process.cwd(),
  "tests/fixtures/no-hallucinated-package-imports",
);
const fixtureFilename = path.join(fixtureRoot, "app.ts");
const packageJsonPath = path.join(fixtureRoot, "package.json");
const packageWithoutDevPath = path.join(
  fixtureRoot,
  "package-without-dev.json",
);
const packageWithoutPeerPath = path.join(
  fixtureRoot,
  "package-without-peer.json",
);
const packageWithoutOptionalPath = path.join(
  fixtureRoot,
  "package-without-optional.json",
);
const invalidPackageJsonPath = path.join(fixtureRoot, "invalid-package.txt");
const missingPackageJsonPath = path.join(fixtureRoot, "missing-package.json");

ruleTester.run("no-hallucinated-package-imports", rule, {
  valid: [
    {
      code: `import { readFile } from "node:fs/promises";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `import path from "path";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `import { helper } from "./helper";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `import missing from "made-up-package";`,
      filename: "<input>",
    },
    {
      code: `import missing from "made-up-package";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath: missingPackageJsonPath }],
    },
    {
      code: `import missing from "made-up-package";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath: invalidPackageJsonPath }],
    },
    {
      code: `import leftPad from "left-pad";`,
      filename: fixtureFilename,
    },
    {
      code: `import leftPad from "left-pad";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `import { Client } from "@declared/sdk/client";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `import { describe } from "vitest";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `import React from "react";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `import tool from "optional-tool";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `import internal from "@fixture/internal-lib";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `import internalUtil from "@fixture/internal-lib/utils";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `import generated from "virtual:generated-module";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath, allow: ["virtual:generated-module"] }],
    },
    {
      code: `import internalMapping from "#internal/mapping";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `export { thing } from "left-pad";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `export * from "left-pad";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `const mod = await import("left-pad");`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `const mod = await import(packageName);`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `const mod = await import(42);`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `const mod = await import("made-up-package");`,
      filename: fixtureFilename,
      options: [{ packageJsonPath, checkDynamicImports: false }],
    },
    {
      code: `const mod = require("made-up-package");`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
    },
    {
      code: `const mod = require(packageName);`,
      filename: fixtureFilename,
      options: [{ packageJsonPath, checkRequire: true }],
    },
    {
      code: `const mod = require(42);`,
      filename: fixtureFilename,
      options: [{ packageJsonPath, checkRequire: true }],
    },
    {
      code: `const resolved = require.resolve("made-up-package");`,
      filename: fixtureFilename,
      options: [{ packageJsonPath, checkRequire: true }],
    },
  ],
  invalid: [
    {
      code: `import { retry } from "super-retry-utils";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
      errors: [{ messageId: "undeclaredPackage" as const }],
    },
    {
      code: `import type { Client } from "@vendor/nonexistent-sdk";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
      errors: [{ messageId: "undeclaredPackage" as const }],
    },
    {
      code: `export { thing } from "plausible-helper-package";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
      errors: [{ messageId: "undeclaredPackage" as const }],
    },
    {
      code: `export * from "@vendor/nonexistent-sdk/client";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
      errors: [{ messageId: "undeclaredPackage" as const }],
    },
    {
      code: `const mod = await import("made-up-package");`,
      filename: fixtureFilename,
      options: [{ packageJsonPath }],
      errors: [{ messageId: "undeclaredPackage" as const }],
    },
    {
      code: `const mod = require("made-up-package");`,
      filename: fixtureFilename,
      options: [{ packageJsonPath, checkRequire: true }],
      errors: [{ messageId: "undeclaredPackage" as const }],
    },
    {
      code: `import { describe } from "vitest";`,
      filename: fixtureFilename,
      options: [
        { packageJsonPath: packageWithoutDevPath, checkDevDependencies: false },
      ],
      errors: [{ messageId: "undeclaredPackage" as const }],
    },
    {
      code: `import React from "react";`,
      filename: fixtureFilename,
      options: [
        {
          packageJsonPath: packageWithoutPeerPath,
          checkPeerDependencies: false,
        },
      ],
      errors: [{ messageId: "undeclaredPackage" as const }],
    },
    {
      code: `import tool from "optional-tool";`,
      filename: fixtureFilename,
      options: [
        {
          packageJsonPath: packageWithoutOptionalPath,
          checkOptionalDependencies: false,
        },
      ],
      errors: [{ messageId: "undeclaredPackage" as const }],
    },
    {
      code: `import internal from "@fixture/internal-lib";`,
      filename: fixtureFilename,
      options: [{ packageJsonPath, workspace: false }],
      errors: [{ messageId: "undeclaredPackage" as const }],
    },
  ],
});
