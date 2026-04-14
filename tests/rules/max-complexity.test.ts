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
    {
      code: `function regularAssignment(value) {
        value = 1;
        return value;
      }`,
      options: [{ max: 1 }],
    },
    {
      code: `function defaultOnly(action) {
        switch (action) {
          default:
            return 0;
        }
      }`,
      options: [{ max: 1 }],
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
    {
      code: `function countFor(items) {
        for (const item of items) {
          consume(item);
        }
      }`,
      options: [{ max: 1 }],
      errors: [{ messageId: "maxComplexity" as const }],
    },
    {
      code: `function countForIn(record) {
        for (const key in record) {
          consume(key);
        }
      }`,
      options: [{ max: 1 }],
      errors: [{ messageId: "maxComplexity" as const }],
    },
    {
      code: `function countWhile(active) {
        while (active()) {
          tick();
        }
      }`,
      options: [{ max: 1 }],
      errors: [{ messageId: "maxComplexity" as const }],
    },
    {
      code: `function countDoWhile(active) {
        do {
          tick();
        } while (active());
      }`,
      options: [{ max: 1 }],
      errors: [{ messageId: "maxComplexity" as const }],
    },
    {
      code: `function countCatch() {
        try {
          work();
        } catch (error) {
          handle(error);
        }
      }`,
      options: [{ max: 1 }],
      errors: [{ messageId: "maxComplexity" as const }],
    },
    {
      code: `function countConditional(flag) {
        return flag ? 1 : 0;
      }`,
      options: [{ max: 1 }],
      errors: [{ messageId: "maxComplexity" as const }],
    },
    {
      code: `function countLogical(left, right) {
        return left && right;
      }`,
      options: [{ max: 1 }],
      errors: [{ messageId: "maxComplexity" as const }],
    },
    {
      code: `function countSwitch(action) {
        switch (action) {
          case "a":
            return 1;
          default:
            return 0;
        }
      }`,
      options: [{ max: 1 }],
      errors: [{ messageId: "maxComplexity" as const }],
    },
    {
      code: `function countDefaultValue(value = 1) {
        return value;
      }`,
      options: [{ max: 1 }],
      errors: [{ messageId: "maxComplexity" as const }],
    },
    {
      code: `function countLogicalAssignment(value) {
        value ||= 1;
        return value;
      }`,
      options: [{ max: 1 }],
      errors: [{ messageId: "maxComplexity" as const }],
    },
    {
      code: `function countOptionalMember(input) {
        return input?.value;
      }`,
      options: [{ max: 1 }],
      errors: [{ messageId: "maxComplexity" as const }],
    },
    {
      code: `function countOptionalCall(callback) {
        return callback?.();
      }`,
      options: [{ max: 1 }],
      errors: [{ messageId: "maxComplexity" as const }],
    },
  ],
});
