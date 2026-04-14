import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import rule from "../../src/rules/max-complexity";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("max-complexity", rule, {
  valid: [
    {
      code: `function atLimit(value) {
        if (value === 1) return 1;
        if (value === 2) return 2;
        if (value === 3) return 3;
        if (value === 4) return 4;
        if (value === 5) return 5;
        if (value === 6) return 6;
        if (value === 7) return 7;
        if (value === 8) return 8;
        if (value === 9) return 9;
        return 10;
      }`,
    },
  ],
  invalid: [
    {
      code: `function tooComplex(value) {
        if (value === 1) return 1;
        if (value === 2) return 2;
        if (value === 3) return 3;
        if (value === 4) return 4;
        if (value === 5) return 5;
        if (value === 6) return 6;
        if (value === 7) return 7;
        if (value === 8) return 8;
        if (value === 9) return 9;
        if (value === 10) return 10;
        return 11;
      }`,
      errors: [{ messageId: "maxComplexity" as const }],
    },
  ],
});
