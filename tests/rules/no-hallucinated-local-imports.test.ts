import path from "node:path";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-hallucinated-local-imports";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();
const fixtureRoot = path.join(
  process.cwd(),
  "tests/fixtures/no-hallucinated-local-imports",
);
const fixtureFilename = path.join(fixtureRoot, "app.ts");

ruleTester.run("no-hallucinated-local-imports", rule, {
  valid: [
    {
      code: `import { readFile } from "fs";`,
      filename: fixtureFilename,
    },
    {
      code: `import { createCache } from "./cache";`,
      filename: fixtureFilename,
    },
    {
      code: `import defaultCacheFlag from "./cache";`,
      filename: fixtureFilename,
    },
    {
      code: `import defaultVal from "./has-default";`,
      filename: fixtureFilename,
    },
    {
      code: `import { runHelper } from "./utils";`,
      filename: fixtureFilename,
    },
    {
      code: `import { publicSecret } from "./aliases";`,
      filename: fixtureFilename,
    },
    {
      code: `const localVal = 1; export { localVal };`,
      filename: fixtureFilename,
    },
    {
      code: `export { createCache } from "./cache";`,
      filename: fixtureFilename,
    },
  ],
  invalid: [
    {
      code: `import { createCache } from "./cache-utils";`,
      filename: fixtureFilename,
      errors: [{ messageId: "missingLocalModule" as const }],
    },
    {
      code: `export { createCache } from "./cache-utils";`,
      filename: fixtureFilename,
      errors: [{ messageId: "missingLocalModule" as const }],
    },
    {
      code: `import { createCacheFactory } from "./cache";`,
      filename: fixtureFilename,
      errors: [{ messageId: "missingNamedExport" as const }],
    },
    {
      code: `import parseUser from "./parser";`,
      filename: fixtureFilename,
      errors: [{ messageId: "missingDefaultExport" as const }],
    },
  ],
});
