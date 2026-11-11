import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-async-array-callbacks";
import { TSESLint } from "@typescript-eslint/utils";
import { describe, expect, it, afterAll } from "vitest";

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

    // async map returned from Promise.any — also safe
    `function run() {
      return Promise.any(items.map(async (item) => {
        return await processItem(item);
      }));
    }`,

    // Deferred: const + await Promise.all — safe
    `async function run() {
      const promises = items.map(async (item) => {
        await processItem(item);
      });
      await Promise.all(promises);
    }`,

    // Deferred: const + return Promise.all — safe
    `function run() {
      const promises = items.map(async (item) => {
        return await processItem(item);
      });
      return Promise.all(promises);
    }`,

    // Deferred: const + await Promise.allSettled — safe
    `async function run() {
      const promises = items.map(async (item) => {
        await processItem(item);
      });
      await Promise.allSettled(promises);
    }`,

    // Deferred: const + await Promise.race — safe
    `async function run() {
      const promises = items.map(async (item) => {
        await processItem(item);
      });
      await Promise.race(promises);
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

    // Promise.race without await/return still drops the outer promise
    {
      code: `function run() {
        Promise.race(items.map(async (item) => {
          return await processItem(item);
        }));
      }`,
      errors: [{ messageId: "noAsyncMapCallback" as const }],
    },

    // Promise.any without await/return still drops the outer promise
    {
      code: `function run() {
        Promise.any(items.map(async (item) => {
          return await processItem(item);
        }));
      }`,
      errors: [{ messageId: "noAsyncMapCallback" as const }],
    },

    // Deferred map stored in const but never consumed by Promise combinator
    {
      code: `async function run() {
        const promises = items.map(async (item) => {
          await processItem(item);
        });
        console.log(promises);
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

function lintMessages(code: string): string[] {
  const config: TSESLint.Linter.ConfigType = [
    {
      plugins: { test: { rules: { "async-callbacks": rule } } },
      rules: { "test/async-callbacks": "error" },
    },
  ];
  return new TSESLint.Linter()
    .verify(code, config)
    .map((message) => message.message);
}

describe("no-async-array-callbacks shows only the flagged method's rewrite", () => {
  it("shows the for...of rewrite for forEach and no other method's recipe", () => {
    const [message] = lintMessages(
      `users.forEach(async (user) => { await notify(user); });`,
    );

    expect(message).toContain(
      "  Before: items.forEach(async (item) => { await processItem(item); });",
    );
    expect(message).toContain(
      "  After:  for (const item of items) { await processItem(item); }",
    );
    expect(message).not.toContain("reduce");
    expect(message).not.toContain("filter");
  });

  it("shows the loop-with-accumulator rewrite for reduce", () => {
    const [message] = lintMessages(
      `orders.reduce(async (sum, order) => (await sum) + order.total, 0);`,
    );

    expect(message).toContain(
      "  Before: const total = items.reduce(async (acc, item) => step(await acc, item), initial);",
    );
    expect(message).toContain(
      [
        "  After:  let total = initial;",
        "          for (const item of items) { total = await step(total, item); }",
      ].join("\n"),
    );
  });

  it("shows the real violating filter call as Before and the two-step rewrite as After", () => {
    const [message] = lintMessages(
      `users.filter(async (user) => isActive(user));`,
    );

    expect(message).toContain(
      "  Before: const kept = items.filter(async (item) => isMatch(item));",
    );
    expect(message).toContain(
      [
        "  After:  const matches = await Promise.all(items.map((item) => isMatch(item)));",
        "          const kept = items.filter((_, index) => matches[index]);",
      ].join("\n"),
    );
  });

  it("shows the resolve-then-some rewrite for some", () => {
    const [message] = lintMessages(
      `users.some(async (user) => isActive(user));`,
    );

    expect(message).toContain(
      "  Before: const found = items.some(async (item) => isMatch(item));",
    );
    expect(message).toContain(
      [
        "  After:  const matches = await Promise.all(items.map((item) => isMatch(item)));",
        "          const found = matches.some(Boolean);",
      ].join("\n"),
    );
  });

  it("shows the resolve-then-every rewrite for every", () => {
    const [message] = lintMessages(
      `users.every(async (user) => isActive(user));`,
    );

    expect(message).toContain(
      "  Before: const allMatch = items.every(async (item) => isMatch(item));",
    );
    expect(message).toContain(
      [
        "  After:  const matches = await Promise.all(items.map((item) => isMatch(item)));",
        "          const allMatch = matches.every(Boolean);",
      ].join("\n"),
    );
  });

  it("shows the resolve-then-flat rewrite for flatMap", () => {
    const [message] = lintMessages(
      `teams.flatMap(async (team) => loadMembers(team));`,
    );

    expect(message).toContain(
      "  Before: const children = items.flatMap(async (item) => loadChildren(item));",
    );
    expect(message).toContain(
      "  After:  const children = (await Promise.all(items.map((item) => loadChildren(item)))).flat();",
    );
  });
});
