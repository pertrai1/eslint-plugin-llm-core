import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-empty-catch";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-empty-catch", rule, {
  valid: [
    // catch with a log call
    `try { doWork(); } catch (e) { logger.error("failed", e); }`,

    // catch with a rethrow
    `try { doWork(); } catch (e) { throw e; }`,

    // catch that rethrows a new error
    `try { doWork(); } catch (e) { throw new Error("failed", { cause: e }); }`,

    // catch with a return
    `function safe() { try { return doWork(); } catch { return null; } }`,

    // catch with logging then rethrow
    `try { doWork(); } catch (e) { logger.error(e); throw e; }`,

    // catch with assignment
    `try { result = doWork(); } catch (e) { result = defaultValue; }`,

    // catch with a console.error call
    `try { doWork(); } catch (e) { console.error(e); }`,

    // Empty statement plus real handling is still meaningful
    `try { doWork(); } catch (e) { ; console.error(e); }`,
  ],

  invalid: [
    // Completely empty catch
    {
      code: `try { doWork(); } catch (e) {}`,
      errors: [{ messageId: "noEmptyCatch" as const }],
    },

    // Empty catch (no param)
    {
      code: `try { doWork(); } catch {}`,
      errors: [{ messageId: "noEmptyCatch" as const }],
    },

    // Comment-only catch — not meaningful
    {
      code: `try { doWork(); } catch (e) {
        // TODO: handle this properly
      }`,
      errors: [{ messageId: "noEmptyCatch" as const }],
    },

    // Multiple comments, still no statements
    {
      code: `try { doWork(); } catch (e) {
        // ignore
        /* intentionally empty */
      }`,
      errors: [{ messageId: "noEmptyCatch" as const }],
    },

    // Semicolon-only catch is still empty
    {
      code: `try { doWork(); } catch (e) { ; }`,
      errors: [{ messageId: "noEmptyCatch" as const }],
    },

    // Comment plus semicolon-only is still empty
    {
      code: `try { doWork(); } catch (e) {
        // intentionally ignored
        ;
      }`,
      errors: [{ messageId: "noEmptyCatch" as const }],
    },
  ],
});
