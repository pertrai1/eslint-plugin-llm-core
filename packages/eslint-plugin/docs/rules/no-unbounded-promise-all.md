# llm-core/no-unbounded-promise-all

📝 Disallow Promise.all fan-out over arbitrary collections without an explicit concurrency bound.

💼 This rule is enabled in the 🌐 `all` config.

<!-- end auto-generated rule header -->

Disallow `Promise.all(collection.map(...))` and `Promise.allSettled(collection.map(...))` fan-out over arbitrary collections unless the work is explicitly bounded.

LLM-generated code often reaches for `Promise.all(items.map(...))` as a generic performance improvement. That is safe for small fixed tuples, but dangerous for user-sized arrays, database records, API pages, queues, and other arbitrary collections because it starts all work at once.

## Rule Details

This rule reports obvious unbounded Promise fan-out patterns:

- `Promise.all(items.map(...))`
- `Promise.allSettled(items.map(...))`
- `Promise.all(Array.from(items).map(...))`
- `const jobs = items.map(...); await Promise.all(jobs)`

It intentionally allows common bounded alternatives:

- small literal arrays such as `Promise.all([loadUser(), loadSettings()])`
- `.map(...)` over literal tuples
- callbacks wrapped in a limiter such as `limit(() => work(item))`
- explicit batching, for example a `for...of` loop over `chunks(items, 10)`
- sequential `for...of` loops when backpressure or ordering matters

## Examples

### Incorrect

```ts
// Starts one email send per user immediately.
await Promise.all(users.map((user) => sendEmail(user)));
```

```ts
// allSettled still starts every item at once.
await Promise.allSettled(records.map((record) => processRecord(record)));
```

```ts
// Storing the mapped promises does not make the fan-out bounded.
const jobs = Array.from(ids).map((id) => fetchUser(id));
await Promise.all(jobs);
```

### Correct

```ts
// Small fixed fan-out is bounded by the literal array size.
const [user, settings] = await Promise.all([
  fetchUser(userId),
  fetchSettings(userId),
]);
```

```ts
// Explicit concurrency limit.
const limit = pLimit(5);
await Promise.all(users.map((user) => limit(() => sendEmail(user))));
```

```ts
// Explicit batching.
for (const batch of chunks(users, 10)) {
  await Promise.all(batch.map((user) => sendEmail(user)));
}
```

```ts
// Sequential backpressure.
for (const user of users) {
  await sendEmail(user);
}
```

## What Counts as Unbounded Fan-Out

| Pattern                                                                               | Triggers? |
| ------------------------------------------------------------------------------------- | --------- |
| `Promise.all(users.map(sendEmail))`                                                   | Yes       |
| `Promise.allSettled(items.map(syncItem))`                                             | Yes       |
| `Promise.all(Array.from(ids).map(fetchUser))`                                         | Yes       |
| `const jobs = users.map(sendEmail); await Promise.all(jobs)`                          | Yes       |
| `Promise.all([fetchUser(id), fetchSettings(id)])`                                     | No        |
| `Promise.all([1, 2, 3].map(fetchUser))`                                               | No        |
| `Promise.all(users.map((user) => limit(() => sendEmail(user))))`                      | No        |
| `for (const batch of chunks(users, 10)) { await Promise.all(batch.map(sendEmail)); }` | No        |

## Error Messages

The error message teaches:

1. **What's wrong** — a collection is being fanned out without a concurrency bound
2. **Why** — large inputs can overload memory, APIs, or database pools
3. **How to fix** — use `p-limit`, batching, or a sequential loop depending on the intended backpressure
