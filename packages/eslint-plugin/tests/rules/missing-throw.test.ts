import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/missing-throw";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("missing-throw", rule, {
  valid: [
    // Correctly throws a constructed Error.
    `function fail() { throw new Error("boom"); }`,

    // Expression-bodied arrow intentionally returns an Error object.
    `const makeError = () => new Error("boom");`,

    // Constructing an Error as a value is valid when it is used.
    `const error = new Error("boom");`,

    // Error objects can be collected for later use.
    `[new Error("boom")];`,

    // Shadowed constructors may be arbitrary side-effectful classes and are not built-ins.
    `function fail(Error: new (message: string) => unknown) { new Error("boom"); }`,

    // Local classes named like built-in constructors are not built-ins.
    `function fail() { class TypeError { constructor(message: string) { console.info(message); } } new TypeError("bad type"); }`,
  ],

  invalid: [
    // New Error as a standalone statement silently does nothing.
    {
      code: `function fail() { new Error("boom"); }`,
      output: `function fail() { throw new Error("boom"); }`,
      errors: [{ messageId: "missingThrow" }],
    },

    // Built-in Error subclasses have the same problem.
    {
      code: `function fail() { new TypeError("bad type"); }`,
      output: `function fail() { throw new TypeError("bad type"); }`,
      errors: [{ messageId: "missingThrow" }],
    },

    // AggregateError is also a built-in Error subclass.
    {
      code: `function fail(errors: Error[]) { new AggregateError(errors, "boom"); }`,
      output: `function fail(errors: Error[]) { throw new AggregateError(errors, "boom"); }`,
      errors: [{ messageId: "missingThrow" }],
    },

    // Transparent TypeScript wrappers still discard the Error object.
    {
      code: `function fail() { new Error("boom") as Error; }`,
      output: `function fail() { throw new Error("boom") as Error; }`,
      errors: [{ messageId: "missingThrow" }],
    },

    // Non-null assertions can wrap the standalone construction too.
    {
      code: `function fail() { new Error("boom")!; }`,
      output: `function fail() { throw new Error("boom")!; }`,
      errors: [{ messageId: "missingThrow" }],
    },
  ],
});
