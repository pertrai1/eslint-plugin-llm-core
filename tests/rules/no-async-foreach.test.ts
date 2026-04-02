import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-async-foreach";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-async-foreach", rule, {
  valid: [
    // Synchronous forEach — fine
    `items.forEach((item) => {
      process(item);
    });`,

    // Synchronous function expression
    `items.forEach(function(item) {
      process(item);
    });`,

    // for...of with await — correct pattern
    `async function processAll(items: string[]) {
      for (const item of items) {
        await processItem(item);
      }
    }`,

    // Promise.all with map — correct parallel pattern
    `async function processAll(items: string[]) {
      await Promise.all(items.map(async (item) => {
        await processItem(item);
      }));
    }`,

    // async arrow in .map (not forEach)
    `items.map(async (item) => {
      await processItem(item);
    });`,

    // async arrow in .filter (not forEach)
    `items.filter(async (item) => {
      return await checkItem(item);
    });`,

    // Named function reference (not inline async)
    `items.forEach(processItem);`,

    // forEach on non-array-like with sync callback
    `customObj.forEach((item: string) => {
      handle(item);
    });`,
  ],

  invalid: [
    // Async arrow function in forEach
    {
      code: `items.forEach(async (item) => {
        await processItem(item);
      });`,
      errors: [{ messageId: "noAsyncForeach" as const }],
    },

    // Async function expression in forEach
    {
      code: `items.forEach(async function(item) {
        await processItem(item);
      });`,
      errors: [{ messageId: "noAsyncForeach" as const }],
    },

    // Chained forEach with async
    {
      code: `getItems().forEach(async (item) => {
        await save(item);
      });`,
      errors: [{ messageId: "noAsyncForeach" as const }],
    },

    // Async with multiple awaits
    {
      code: `users.forEach(async (user) => {
        const profile = await fetchProfile(user.id);
        await updateCache(user.id, profile);
      });`,
      errors: [{ messageId: "noAsyncForeach" as const }],
    },

    // Async arrow with try/catch inside
    {
      code: `items.forEach(async (item) => {
        try {
          await riskyOperation(item);
        } catch (e) {
          log(e);
        }
      });`,
      errors: [{ messageId: "noAsyncForeach" as const }],
    },

    // Member expression chain
    {
      code: `this.items.forEach(async (item) => {
        await item.save();
      });`,
      errors: [{ messageId: "noAsyncForeach" as const }],
    },
  ],
});
