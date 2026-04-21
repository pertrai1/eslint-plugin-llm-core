import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-floating-promise";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-floating-promise", rule, {
  valid: [
    // Non-async function — not a promise
    `function syncFn() {} syncFn();`,

    // Awaited async call
    `async function saveData() {}
     async function run() { await saveData(); }`,

    // Returned async call
    `async function saveData() {}
     async function run() { return saveData(); }`,

    // Stored in const — result is captured for later use
    `async function saveData() {}
     async function run() { const p = saveData(); await p; }`,

    // Explicit fire-and-forget
    `async function saveData() {}
     void saveData();`,

    // Promise.all awaited
    `async function run() { await Promise.all([p1, p2]); }`,

    // Promise.resolve returned
    `function run() { return Promise.resolve(42); }`,
  ],

  invalid: [
    // Async function declaration called at statement position
    {
      code: `async function saveData() {}
             saveData();`,
      errors: [{ messageId: "noFloatingPromise" as const }],
    },

    // Promise.all at statement position
    {
      code: `Promise.all([p1, p2]);`,
      errors: [{ messageId: "noFloatingPromise" as const }],
    },

    // Promise.resolve at statement position
    {
      code: `Promise.resolve(42);`,
      errors: [{ messageId: "noFloatingPromise" as const }],
    },
  ],
});
