import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-async-promise-executor";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-async-promise-executor", rule, {
  valid: [
    // Synchronous executors are the normal Promise constructor shape.
    `const result = new Promise((resolve) => { resolve(loadValue()); });`,

    // Async callbacks passed to other APIs are outside this rule's scope.
    `queueTask(async () => { await saveValue(); });`,
  ],

  invalid: [
    // Async Promise executors can drop thrown errors instead of rejecting the outer promise.
    {
      code: `const result = new Promise(async (resolve) => { resolve(await loadValue()); });`,
      errors: [{ messageId: "noAsyncPromiseExecutor" as const }],
    },

    // Function expressions have the same executor hazard as async arrows.
    {
      code: `const result = new Promise(async function(resolve, reject) { reject(await loadError()); });`,
      errors: [{ messageId: "noAsyncPromiseExecutor" as const }],
    },
  ],
});
