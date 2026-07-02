import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-unbounded-promise-all";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-unbounded-promise-all", rule, {
  valid: [
    // Small fixed fan-out is explicitly bounded by the literal array size.
    `async function loadUser(id: string) {
      const [user, settings] = await Promise.all([
        fetchUser(id),
        fetchSettings(id),
      ]);
      return { user, settings };
    }`,

    // Sequential work is intentionally bounded by awaiting each item.
    `async function sendAll(users: User[]) {
      for (const user of users) {
        await sendEmail(user);
      }
    }`,

    // p-limit style wrappers make the map fan-out explicitly bounded.
    `async function sendAll(users: User[]) {
      const limit = pLimit(5);
      await Promise.all(users.map((user) => limit(() => sendEmail(user))));
    }`,

    // Configured project limiters can use names other than "limit".
    `async function sendAll(users: User[]) {
      const concurrency = createLimiter(5);
      await Promise.all(users.map((user) => concurrency(() => sendEmail(user))));
    }`,

    // Explicit batching bounds each Promise.all call to the current chunk.
    `async function sendAll(users: User[]) {
      for (const batch of chunks(users, 10)) {
        await Promise.all(batch.map((user) => sendEmail(user)));
      }
    }`,

    // Map over a literal tuple is bounded by the literal size.
    `async function run() {
      await Promise.all([1, 2, 3].map((id) => fetchUser(id)));
    }`,

    // Array.from({ length }) creates a bounded fixed-size collection.
    `async function run(count: number) {
      await Promise.all(Array.from({ length: count }).map((_, index) => fetchPage(index)));
    }`,

    // Batching can also use an existing loop variable.
    `async function sendAll(users: User[]) {
      let batch;
      for (batch of chunks(users, 10)) {
        await Promise.all(batch.map((user) => sendEmail(user)));
      }
    }`,

    // Nested loops should still recognize a map source from an outer bounded batch.
    `async function sendAll(users: User[], queues: Queue[]) {
      for (const batch of chunks(users, 10)) {
        for (const queue of queues) {
          await Promise.all(batch.map((user) => queue.send(user)));
        }
      }
    }`,

    // Block-bodied limiter callbacks are still explicitly bounded.
    `async function sendAll(users: User[]) {
      const limit = pLimit(5);
      await Promise.all(users.map((user) => {
        const email = user.email;
        return limit(() => sendEmail(email));
      }));
    }`,

    // Unresolved identifiers are outside this rule's narrow syntactic scope.
    `async function run() {
      await Promise.all(jobs);
    }`,

    // Non-array Promise.all inputs are outside the rule's narrow syntactic scope.
    `async function run(promises: Promise<string>[]) {
      return Promise.all(promises);
    }`,
  ],

  invalid: [
    // Direct unbounded collection fan-out.
    {
      code: `async function sendAll(users: User[]) {
        await Promise.all(users.map(async (user) => sendEmail(user)));
      }`,
      errors: [{ messageId: "noUnboundedPromiseAll" as const }],
    },

    // Returning the Promise.all result is still unbounded fan-out.
    {
      code: `function processRecords(records: Record[]) {
        return Promise.all(records.map((record) => processRecord(record)));
      }`,
      errors: [{ messageId: "noUnboundedPromiseAll" as const }],
    },

    // allSettled has the same concurrency pressure as all.
    {
      code: `async function syncItems(items: Item[]) {
        await Promise.allSettled(items.map((item) => syncItem(item)));
      }`,
      errors: [{ messageId: "noUnboundedPromiseAll" as const }],
    },

    // Array.from(collection).map(...) hides the same unbounded collection shape.
    {
      code: `async function hydrate(ids: Set<string>) {
        await Promise.all(Array.from(ids).map((id) => fetchUser(id)));
      }`,
      errors: [{ messageId: "noUnboundedPromiseAll" as const }],
    },

    // Deferred map variables should still be reported when consumed later.
    {
      code: `async function sendAll(users: User[]) {
        const jobs = users.map((user) => sendEmail(user));
        await Promise.all(jobs);
      }`,
      errors: [{ messageId: "noUnboundedPromiseAll" as const }],
    },

    // Deferred map variables should resolve through an inner scope.
    {
      code: `function schedule(users: User[]) {
        const jobs = users.map((user) => sendEmail(user));
        async function flush() {
          await Promise.all(jobs);
        }
        return flush;
      }`,
      errors: [{ messageId: "noUnboundedPromiseAll" as const }],
    },

    // Function references are not limiters unless wrapped explicitly.
    {
      code: `async function sendAll(users: User[]) {
        await Promise.all(users.map(sendEmail));
      }`,
      errors: [{ messageId: "noUnboundedPromiseAll" as const }],
    },
  ],
});
