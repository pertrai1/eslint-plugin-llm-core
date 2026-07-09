import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/prefer-unknown-in-catch";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("prefer-unknown-in-catch", rule, {
  valid: [
    // No type annotation — TS defaults to unknown (fine)
    `try { doWork(); } catch (e) { console.error(e); }`,

    // Explicit unknown — correct
    `try { doWork(); } catch (e: unknown) {
      if (e instanceof Error) { console.error(e.message); }
    }`,

    // No catch param at all
    `try { doWork(); } catch { }`,

    // any in a non-catch context is not flagged by this rule
    `function foo(x: any) { return x; }`,

    // any in a generic is not flagged by this rule
    `const x: Array<any> = [];`,
  ],

  invalid: [
    // catch (e: any) — should be unknown
    {
      code: `try { doWork(); } catch (e: any) { console.log(e.message); }`,
      errors: [{ messageId: "preferUnknownInCatch" as const }],
    },

    // catch with any and destructuring-style usage
    {
      code: `try {
        await fetchData();
      } catch (err: any) {
        logger.error(err.stack);
      }`,
      errors: [{ messageId: "preferUnknownInCatch" as const }],
    },

    // Multiple try-catch blocks — each flagged independently
    {
      code: `
        try { a(); } catch (e: any) { log(e); }
        try { b(); } catch (e: any) { log(e); }
      `,
      errors: [
        { messageId: "preferUnknownInCatch" as const },
        { messageId: "preferUnknownInCatch" as const },
      ],
    },
  ],
});
