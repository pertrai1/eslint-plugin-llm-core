import path from "node:path";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-hallucinated-local-imports";
import { TSESLint } from "@typescript-eslint/utils";
import { describe, expect, it, afterAll } from "vitest";

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
    {
      code: `export * from "./cache";`,
      filename: fixtureFilename,
    },
    {
      code: `export * as ns from "./cache";`,
      filename: fixtureFilename,
    },
    {
      code: `import x from "./alias-default";`,
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
    {
      code: `export * from "./cache-utils";`,
      filename: fixtureFilename,
      errors: [{ messageId: "missingLocalModule" as const }],
    },
    {
      code: `export * as ns from "./cache-utils";`,
      filename: fixtureFilename,
      errors: [{ messageId: "missingLocalModule" as const }],
    },
  ],
});

function lintFixture(code: string, filename = fixtureFilename): string[] {
  const config: TSESLint.Linter.ConfigType = [
    {
      files: ["**/*.ts"],
      plugins: { test: { rules: { "local-imports": rule } } },
      rules: { "test/local-imports": "error" },
    },
  ];
  return new TSESLint.Linter()
    .verify(code, config, { filename })
    .map((message) => message.message);
}

describe("no-hallucinated-local-imports message details", () => {
  it("names the missing binding, the module, and the module's real named exports", () => {
    const [message] = lintFixture(
      `import { createCacheFactory } from "./cache";`,
    );

    expect(message).toContain(
      "'./cache' has no export named 'createCacheFactory'.",
    );
    expect(message).toContain(
      "Named exports available in './cache': clearCache, createCache",
    );
  });

  it("names the module without a default export and lists its named exports", () => {
    const [message] = lintFixture(`import parseUser from "./parser";`);

    expect(message).toContain("'./parser' has no default export.");
    expect(message).toContain(
      "Named exports available in './parser': parseUserRecord",
    );
  });

  it("says so when the module has no named exports to offer", () => {
    const [message] = lintFixture(`import { helper } from "./only-default";`);

    expect(message).toContain(
      "Named exports available in './only-default': none (the module only has a default export)",
    );
  });

  it("caps a long export list at twenty names and counts the remainder", () => {
    const [message] = lintFixture(`import { missing } from "./many-exports";`);

    expect(message).toContain(
      "Named exports available in './many-exports': e01, e02, e03, e04, e05, e06, e07, e08, e09, e10, e11, e12, e13, e14, e15, e16, e17, e18, e19, e20, and 3 more",
    );
  });

  it("names the unresolved path and lists the modules that do exist beside it", () => {
    const [message] = lintFixture(
      `import { createCache } from "./cache-utils";`,
    );

    expect(message).toContain(
      "'./cache-utils' does not resolve to a local module.",
    );
    expect(message).toContain(
      "Local modules in that directory: ./alias-default, ./aliases, ./cache, ./has-default, ./many-exports, ./only-default, ./parser, ./utils",
    );
  });

  it("does not offer the importing file itself as a sibling module", () => {
    const [message] = lintFixture(
      `import { helper } from "../utils/helpers";`,
      path.join(fixtureRoot, "utils/index.ts"),
    );

    expect(message).toContain(
      "Local modules in that directory: none (no other modules found in '../utils/')",
    );
  });

  it("says the directory does not exist when the path points outside any real folder", () => {
    const [message] = lintFixture(`import { thing } from "../nowhere/thing";`);

    expect(message).toContain(
      "Local modules in that directory: none (directory '../nowhere/' does not exist)",
    );
  });
});
