import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-swallowed-errors";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-swallowed-errors", rule, {
  valid: [
    `try { doWork(); } catch (e) {}`,
    `try { doWork(); } catch (e) { ; }`,
    `try { doWork(); } catch (e) { throw e; }`,
    `try { doWork(); } catch (e) { throw new Error('fail', { cause: e }); }`,
    `function safe() { try { return doWork(); } catch (e) { return null; } }`,
    `try { doWork(); } catch (e) { logger.error('fail', e); }`,
    `try { doWork(); } catch (e) { logger.error(e); throw e; }`,
    `try { doWork(); } catch (e) { console.error(e); throw e; }`,
    `try { doWork(); } catch (e) { Sentry.captureException(e); }`,
    `try { doWork(); } catch (e) { handleError(e); }`,
    `try { doWork(); } catch (e) { console.error(e); handleError(e); }`,
  ],
  invalid: [
    {
      code: `try { doWork(); } catch (e) { console.log(e); }`,
      errors: [{ messageId: "noSwallowedErrors" as const }],
    },
    {
      code: `try { doWork(); } catch (e) { console.error(e); }`,
      errors: [{ messageId: "noSwallowedErrors" as const }],
    },
    {
      code: `try { doWork(); } catch (e) { console.warn('Failed', e); }`,
      errors: [{ messageId: "noSwallowedErrors" as const }],
    },
    {
      code: `try { doWork(); } catch (e) { console.log(e); console.error(e); }`,
      errors: [{ messageId: "noSwallowedErrors" as const }],
    },
    {
      code: `try { doWork(); } catch (e) { console.debug(e); }`,
      errors: [{ messageId: "noSwallowedErrors" as const }],
    },
  ],
});
