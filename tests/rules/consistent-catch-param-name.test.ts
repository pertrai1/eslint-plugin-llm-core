import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/consistent-catch-param-name";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("consistent-catch-param-name", rule, {
  valid: [
    // Default name "error" — matches expected
    `try { doWork(); } catch (error) { console.error(error); }`,

    // Optional catch binding — no param, skip
    `try { doWork(); } catch { }`,

    // Custom name option — "err" matches
    {
      code: `try { doWork(); } catch (err) { console.error(err); }`,
      options: [{ name: "err" }],
    },

    // Custom name option — "e" matches
    {
      code: `try { doWork(); } catch (e) { console.error(e); }`,
      options: [{ name: "e" }],
    },

    // Destructuring pattern — skipped because it's not an Identifier
    `try { doWork(); } catch ({ message }) { console.error(message); }`,

    // Array destructuring pattern — skipped
    `try { doWork(); } catch ([first]) { console.error(first); }`,

    // Multiple try/catch blocks with consistent naming
    `try { doWork(); } catch (error) { console.error(error); }
     try { doMore(); } catch (error) { console.error(error); }`,
  ],

  invalid: [
    // "e" when expected "error" (default)
    {
      code: `try { doWork(); } catch (e) { console.error(e); }`,
      errors: [
        {
          messageId: "consistentCatchParamName" as const,
          data: { actual: "e", expected: "error" },
        },
      ],
    },

    // "err" when expected "error" (default)
    {
      code: `try { doWork(); } catch (err) { console.error(err); }`,
      errors: [
        {
          messageId: "consistentCatchParamName" as const,
          data: { actual: "err", expected: "error" },
        },
      ],
    },

    // "ex" when expected "error" (default)
    {
      code: `try { doWork(); } catch (ex) { console.error(ex); }`,
      errors: [
        {
          messageId: "consistentCatchParamName" as const,
          data: { actual: "ex", expected: "error" },
        },
      ],
    },

    // "error" when custom name is "err"
    {
      code: `try { doWork(); } catch (error) { console.error(error); }`,
      options: [{ name: "err" }],
      errors: [
        {
          messageId: "consistentCatchParamName" as const,
          data: { actual: "error", expected: "err" },
        },
      ],
    },

    // Multiple catch blocks — both flagged
    {
      code: `try { doWork(); } catch (e) { console.error(e); }
             try { doMore(); } catch (err) { console.error(err); }`,
      errors: [
        {
          messageId: "consistentCatchParamName" as const,
          data: { actual: "e", expected: "error" },
        },
        {
          messageId: "consistentCatchParamName" as const,
          data: { actual: "err", expected: "error" },
        },
      ],
    },

    // Nested try/catch — inner one flagged
    {
      code: `try {
        try { doWork(); } catch (e) { console.error(e); }
      } catch (error) { console.error(error); }`,
      errors: [
        {
          messageId: "consistentCatchParamName" as const,
          data: { actual: "e", expected: "error" },
        },
      ],
    },
  ],
});
