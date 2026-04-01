import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/max-file-length";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

function generateLines(count: number): string {
  return Array.from({ length: count }, (_, i) => `const x${i} = ${i};`).join(
    "\n",
  );
}

ruleTester.run("max-file-length", rule, {
  valid: [
    // Short file
    "const x = 1;",

    // At default limit
    {
      code: generateLines(250),
    },

    // Blank lines don't count (default)
    {
      code: generateLines(100) + "\n".repeat(200) + generateLines(100),
    },

    // Custom higher limit
    {
      code: generateLines(400),
      options: [{ max: 500 }],
    },
  ],

  invalid: [
    // Just over default limit
    {
      code: generateLines(251),
      errors: [{ messageId: "maxFileLength" as const }],
    },

    // Way over
    {
      code: generateLines(500),
      errors: [{ messageId: "maxFileLength" as const }],
    },

    // Custom max of 10
    {
      code: generateLines(11),
      options: [{ max: 10 }],
      errors: [{ messageId: "maxFileLength" as const }],
    },

    // With skipBlankLines: false, blank lines count
    {
      code: "const a = 1;\n" + "\n".repeat(10) + "const b = 2;",
      options: [{ max: 5, skipBlankLines: false }],
      errors: [{ messageId: "maxFileLength" as const }],
    },
  ],
});
