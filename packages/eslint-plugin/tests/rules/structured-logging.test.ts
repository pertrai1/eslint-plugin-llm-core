import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/structured-logging";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("structured-logging", rule, {
  valid: [
    // Static string messages
    'console.log("Server started");',
    'console.error("Failed to fetch data");',
    'console.warn("Deprecated API call");',
    'console.info("Processing complete");',

    // Static template literal (no expressions)
    "console.log(`Server started`);",

    // Static message with structured metadata
    'console.error("Failed to fetch data", { userId, endpoint });',
    'logger.error("Request failed", { statusCode: 500 });',
    'logger.info("User logged in", { userId });',

    // Standalone log functions with static messages
    'logError("Something went wrong");',
    'logInfo("Task completed", { taskId });',
    'logWarn("Rate limit approaching", { current, max });',
    'logDebug("Cache hit", { key });',

    // logException with error object + static message
    'logException(error, "Failed to process request");',
    'logException(err, "Database connection lost", { retries });',

    // Non-logging functions can use dynamic strings
    "const msg = `Hello ${name}`;",
    "throw new Error(`Not found: ${id}`);",
    "someFunction(`template ${value}`);",

    // Method calls that aren't log methods
    "formatter.format(`value: ${x}`);",
    "str.concat(`foo ${bar}`);",

    // No arguments
    "console.log();",
    "logger.info();",

    // Non-string first argument (numbers, objects, etc.)
    "console.log(42);",
    "console.log(obj);",
    "console.log({ key: value });",
  ],

  invalid: [
    // Template literal with expression in console methods
    {
      code: "console.log(`User ${userId} logged in`);",
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },
    {
      code: "console.error(`Failed for user ${userId}`);",
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },
    {
      code: "console.warn(`Rate limit: ${count}/${max}`);",
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },
    {
      code: "console.info(`Processing item ${itemId}`);",
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },

    // String concatenation in console methods
    {
      code: 'console.log("User " + userId + " logged in");',
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },
    {
      code: 'console.error("Error: " + error.message);',
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },

    // Template literal in logger methods
    {
      code: "logger.error(`Request ${requestId} failed`);",
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },
    {
      code: "logger.info(`User ${name} signed up`);",
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },
    {
      code: "logger.warn(`Slow query: ${duration}ms`);",
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },
    {
      code: "logger.debug(`Cache miss for ${key}`);",
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },

    // Standalone log functions with dynamic messages
    {
      code: "logError(`Failed for ${userId}`);",
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },
    {
      code: 'logInfo("Processed " + count + " items");',
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },
    {
      code: "logWarn(`Approaching limit: ${current}`);",
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },

    // logException with dynamic message in second arg
    {
      code: "logException(error, `Request ${requestId} timed out`);",
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },

    // String concatenation in logger
    {
      code: 'logger.error("User " + userId + " not found");',
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },

    // console.trace
    {
      code: "console.trace(`Trace: ${label}`);",
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },
  ],
});

// Test with custom options
const customRuleTester = new RuleTester();

customRuleTester.run("structured-logging (custom options)", rule, {
  valid: [
    // Default log functions NOT flagged when overridden
    {
      code: "logError(`dynamic ${value}`);",
      options: [{ logFunctions: ["customLog"], logMethods: ["write"] }],
    },
    // console.log NOT flagged when methods overridden
    {
      code: "console.log(`dynamic ${value}`);",
      options: [{ logFunctions: ["customLog"], logMethods: ["write"] }],
    },
  ],
  invalid: [
    // Custom function flagged
    {
      code: "customLog(`dynamic ${value}`);",
      options: [{ logFunctions: ["customLog"], logMethods: ["write"] }],
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },
    // Custom method flagged
    {
      code: "output.write(`dynamic ${value}`);",
      options: [{ logFunctions: ["customLog"], logMethods: ["write"] }],
      errors: [{ messageId: "dynamicLogMessage" as const }],
    },
  ],
});
