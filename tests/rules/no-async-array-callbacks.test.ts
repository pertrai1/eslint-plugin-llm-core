import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-async-array-callbacks";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-async-array-callbacks", rule, {
  valid: [
    // Sync forEach — fine
    `items.forEach((item) => { process(item); });`,

    // Sync filter
    `items.filter((item) => item.active);`,

    // Sync some / every
    `items.some((item) => item.valid);`,
    `items.every((item) => item.ready);`,

    // Named function reference — not an inline async
    `items.forEach(processItem);`,

    // async map wrapped in Promise.all — the documented good pattern
    `async function run() {
      await Promise.all(items.map(async (item) => {
        await processItem(item);
      }));
    }`,

    // async map wrapped in Promise.allSettled — also allowed
    `async function run() {
      await Promise.allSettled(items.map(async (item) => {
        await processItem(item);
      }));
    }`,

    // async map returned directly from a function — also safe
    `function run() {
      return Promise.all(items.map(async (item) => {
        return await processItem(item);
      }));
    }`,

    // async map wrapped in Promise.race — also allowed
    `async function run() {
      await Promise.race(items.map(async (item) => {
        await processItem(item);
      }));
    }`,

    // async map wrapped in Promise.any — also allowed
    `async function run() {
      await Promise.any(items.map(async (item) => {
        await processItem(item);
      }));
    }`,

    // async map returned from Promise.race — also safe
    `function run() {
      return Promise.race(items.map(async (item) => {
        return await processItem(item);
      }));
    }`,

    // Sync map — fine
    `items.map((item) => item.value);`,

    // Unrelated method with async callback — not flagged
    `customObj.process(async (item) => { await save(item); });`,
  ],

  invalid: [
    // forEach with async arrow
    {
      code: `items.forEach(async (item) => { await processItem(item); });`,
      errors: [{ messageId: "noAsyncArrayCallback" as const }],
    },

    // forEach with async function expression
    {
      code: `items.forEach(async function(item) { await processItem(item); });`,
      errors: [{ messageId: "noAsyncArrayCallback" as const }],
    },

    // filter with async callback
    {
      code: `items.filter(async (item) => { return await check(item); });`,
      errors: [{ messageId: "noAsyncArrayCallback" as const }],
    },

    // some with async callback
    {
      code: `items.some(async (item) => { return await isValid(item); });`,
      errors: [{ messageId: "noAsyncArrayCallback" as const }],
    },

    // every with async callback
    {
      code: `items.every(async (item) => { return await isReady(item); });`,
      errors: [{ messageId: "noAsyncArrayCallback" as const }],
    },

    // reduce with async callback
    {
      code: `items.reduce(async (acc, item) => { return await fold(acc, item); }, []);`,
      errors: [{ messageId: "noAsyncArrayCallback" as const }],
    },

    // flatMap with async callback
    {
      code: `items.flatMap(async (item) => { return await expand(item); });`,
      errors: [{ messageId: "noAsyncArrayCallback" as const }],
    },

    // map with async callback NOT wrapped in Promise.all
    {
      code: `const results = items.map(async (item) => { return await processItem(item); });`,
      errors: [{ messageId: "noAsyncMapCallback" as const }],
    },

    // map with async callback result stored without awaiting
    {
      code: `items.map(async (item) => { await save(item); });`,
      errors: [{ messageId: "noAsyncMapCallback" as const }],
    },

    // Promise.all without await/return still drops the outer promise
    {
      code: `function run() {
        Promise.all(items.map(async (item) => {
          return await processItem(item);
        }));
      }`,
      errors: [{ messageId: "noAsyncMapCallback" as const }],
    },

    // Chained forEach with async
    {
      code: `getItems().forEach(async (item) => { await save(item); });`,
      errors: [{ messageId: "noAsyncArrayCallback" as const }],
    },

    // Member expression chain forEach
    {
      code: `this.items.forEach(async (item) => { await item.save(); });`,
      errors: [{ messageId: "noAsyncArrayCallback" as const }],
    },
  ],
});
