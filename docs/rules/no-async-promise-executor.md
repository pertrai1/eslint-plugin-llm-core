# llm-core/no-async-promise-executor

📝 Disallow async Promise executor functions because thrown errors are not captured by the outer Promise.

💼 This rule is enabled in the following configs: 🌐 `all`, 🏆 `best-practices`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Disallow `async` functions as `new Promise(...)` executors. LLMs often wrap an already-async operation in a Promise constructor and mark the executor `async`, but the Promise constructor does not await that executor.

## Rule Details

The Promise constructor expects a synchronous executor. If an async executor throws after an `await`, that error belongs to the executor's implicit Promise, not the outer Promise being constructed. That can leave the outer Promise unresolved while the async failure escapes through an unhandled rejection.

## Examples

### Incorrect

```ts
const result = new Promise(async (resolve) => {
  resolve(await loadValue());
});

const loaded = new Promise(async function (resolve, reject) {
  try {
    resolve(await loadValue());
  } catch (error) {
    reject(error);
  }
});
```

### Correct

```ts
const result = loadValue();

const loaded = new Promise((resolve, reject) => {
  loadValue().then(resolve, reject);
});

const fromCallback = new Promise((resolve, reject) => {
  readFile(path, (error, contents) => {
    if (error) {
      reject(error);
      return;
    }

    resolve(contents);
  });
});
```

## What This Rule Catches

| Pattern                                    | Triggers? |
| ------------------------------------------ | --------- |
| `new Promise(async (resolve) => { ... })`  | Yes       |
| `new Promise(async function () { ... })`   | Yes       |
| `new Promise((resolve) => { ... })`        | No        |
| `queueTask(async () => { await save(); })` | No        |

## Error Messages

The error message teaches:

1. **What's wrong** -- an async function is being used as a Promise executor
2. **Why** -- the Promise constructor does not await async executors
3. **How to fix** -- return the async operation directly, or keep manual Promise executors synchronous
