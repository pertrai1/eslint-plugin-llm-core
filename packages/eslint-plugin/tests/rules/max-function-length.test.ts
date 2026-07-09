import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/max-function-length";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

function generateLines(count: number): string {
  return Array.from({ length: count }, (_, i) => `  const x${i} = ${i};`).join(
    "\n",
  );
}

ruleTester.run("max-function-length", rule, {
  valid: [
    // Short function
    "function short() { return 1; }",

    // Arrow function
    "const short = () => 1;",

    // Exactly at default limit (50 non-blank lines)
    {
      code: `function atLimit() {\n${generateLines(48)}\n}`,
    },

    // Long function but with custom higher limit
    {
      code: `function long() {\n${generateLines(80)}\n}`,
      options: [{ max: 100 }],
    },

    // Blank lines don't count (default skipBlankLines: true)
    {
      code: `function withBlanks() {\n${generateLines(10)}\n\n\n\n\n\n\n\n\n\n}`,
    },

    // Class method within limit
    {
      code: `class Foo { bar() {\n${generateLines(48)}\n} }`,
    },

    // Test files skipped by default
    {
      code: `function veryLong() {\n${generateLines(100)}\n}`,
      filename: "foo.test.ts",
    },
    {
      code: `function veryLong() {\n${generateLines(100)}\n}`,
      filename: "foo.spec.ts",
    },
    {
      code: `function veryLong() {\n${generateLines(100)}\n}`,
      filename: "foo.test.tsx",
    },
  ],

  invalid: [
    // Just over the default limit
    {
      code: `function tooLong() {\n${generateLines(50)}\n}`,
      errors: [{ messageId: "maxFunctionLength" as const }],
    },

    // Way over
    {
      code: `function veryLong() {\n${generateLines(100)}\n}`,
      errors: [{ messageId: "maxFunctionLength" as const }],
    },

    // Arrow function too long
    {
      code: `const tooLong = () => {\n${generateLines(50)}\n};`,
      errors: [{ messageId: "maxFunctionLength" as const }],
    },

    // Function expression too long
    {
      code: `const tooLong = function() {\n${generateLines(50)}\n};`,
      errors: [{ messageId: "maxFunctionLength" as const }],
    },

    // Custom max of 10
    {
      code: `function fn() {\n${generateLines(10)}\n}`,
      options: [{ max: 10 }],
      errors: [{ messageId: "maxFunctionLength" as const }],
    },

    // With skipBlankLines: false, blank lines count
    {
      code: `function fn() {\n  const a = 1;\n\n\n\n\n\n\n\n\n\n  const b = 2;\n}`,
      options: [{ max: 5, skipBlankLines: false }],
      errors: [{ messageId: "maxFunctionLength" as const }],
    },

    // Class method too long
    {
      code: `class Foo { bar() {\n${generateLines(50)}\n} }`,
      errors: [{ messageId: "maxFunctionLength" as const }],
    },

    // Exported function too long
    {
      code: `export function handler() {\n${generateLines(50)}\n}`,
      errors: [{ messageId: "maxFunctionLength" as const }],
    },

    // Async function too long
    {
      code: `async function fetch() {\n${generateLines(50)}\n}`,
      errors: [{ messageId: "maxFunctionLength" as const }],
    },

    // Test file NOT skipped when skipTestFiles is false
    {
      code: `function veryLong() {\n${generateLines(50)}\n}`,
      filename: "foo.test.ts",
      options: [{ skipTestFiles: false }],
      errors: [{ messageId: "maxFunctionLength" as const }],
    },
  ],
});
