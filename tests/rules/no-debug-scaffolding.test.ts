import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-debug-scaffolding";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-debug-scaffolding", rule, {
  valid: [
    'console.error("Failed to save user", error);',
    'console.warn("Deprecated API used", { route });',
    'console.info("Migration complete", { rows });',
    'console.log("Server started");',
    "console.log(`Server started`);",
    'console.log("Processed batch", { batchId, count });',
    'logger.debug("Cache hit", { key });',
    'audit.log("User authenticated", { userId });',
    "const console = logger; console.log(value);",
    'console["log"]("debug", value);',
    "console.log(`User ${userId} logged in`);", // Covered by structured-logging.
    "print(data);",
  ],

  invalid: [
    {
      code: "debugger;",
      errors: [{ messageId: "debuggerStatement" as const }],
    },
    {
      code: 'console.log("debug", value);',
      errors: [{ messageId: "temporaryConsole" as const }],
    },
    {
      code: 'console.log("here");',
      errors: [{ messageId: "temporaryConsole" as const }],
    },
    {
      code: "console.log(`debug`);",
      errors: [{ messageId: "temporaryConsole" as const }],
    },
    {
      code: 'console.debug("response", response);',
      errors: [{ messageId: "temporaryConsole" as const }],
    },
    {
      code: 'console.trace("trace", value);',
      errors: [{ messageId: "temporaryConsole" as const }],
    },
    {
      code: "console.log(user);",
      errors: [{ messageId: "rawConsoleDump" as const }],
    },
    {
      code: "console.log({ user });",
      errors: [{ messageId: "rawConsoleDump" as const }],
    },
    {
      code: "console.log(getState());",
      errors: [{ messageId: "rawConsoleDump" as const }],
    },
    {
      code: 'console.log("TODO remove", result);',
      errors: [{ messageId: "temporaryConsole" as const }],
    },
    {
      code: "console.log();",
      errors: [{ messageId: "temporaryConsole" as const }],
    },
  ],
});
