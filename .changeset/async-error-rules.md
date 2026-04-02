---
"eslint-plugin-llm-core": minor
---

Add new async/error handling rules and fix max-nesting-depth bug

**New rules:**

- `no-async-array-callbacks` - Disallow async callbacks in array methods where Promises are silently discarded (replaces `no-async-foreach` with broader coverage for `filter`, `some`, `every`, `reduce`, `flatMap`)
- `throw-error-objects` - Disallow throwing non-Error values (strings, objects, arrays)
- `no-empty-catch` - Disallow catch blocks with no meaningful error handling
- `prefer-unknown-in-catch` - Disallow `catch (e: any)`, prefer `unknown` with type narrowing

**Bug fixes:**

- `max-nesting-depth` now correctly resets depth at function boundaries (previously depth leaked across nested functions)

**Breaking changes:**

- `no-async-foreach` has been replaced by `no-async-array-callbacks` (covers more array methods)
