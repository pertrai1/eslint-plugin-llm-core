import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-redundant-comments";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-redundant-comments", rule, {
  valid: [
    "// Explains why the cache must be bypassed for stale replicas\nconst result = fetchFreshUser(userId);",
    "// Validate before persisting because external webhook payloads are untrusted\nvalidatePayload(payload);",
    "// Only return cached data when the caller accepts stale results\nreturn cache.get(key);",
    "// TODO(#123): add request tracing for failed webhook deliveries\nsendWebhook(payload);",
    `/**
 * Validates user input from the public API.
 */
function validateUser(input: unknown) {
  return UserSchema.parse(input);
}`,
    "// Important: normalize Turkish dotted I before slug comparison\nconst slug = normalizeSlug(input);",
    "// This branch handles the retry path after a 429 response\nif (shouldRetry(response)) { retry(); }",
    "// Get\ngetValue();",
    "// User input\nvalidateUser(input);",
    "/* Validate the user input */\nvalidateUser(input);",
    "// Validate the user input\ncheckUser(input);",
    "// Send the event\napi[getLogger()]('event');",
    "// Return the result\n\nreturn result;",
    "doSomething(); // Return the result\nreturn fallback;",
  ],
  invalid: [
    {
      code: "// Validate the user input\nvalidateUser(input);",
      errors: [{ messageId: "redundantComment" as const }],
    },
    {
      code: "// Return the result\nreturn result;",
      errors: [{ messageId: "redundantComment" as const }],
    },
    {
      code: "// Check if the user exists\nif (user) {\n  activateUser(user);\n}",
      errors: [{ messageId: "redundantComment" as const }],
    },
    {
      code: "// Set the user name\nuser.name = name;",
      errors: [{ messageId: "redundantComment" as const }],
    },
    {
      code: "// Assign the user name\nuser.name = name;",
      errors: [{ messageId: "redundantComment" as const }],
    },
    {
      code: "// Process each item\nfor (const item of items) {\n  processItem(item);\n}",
      errors: [{ messageId: "redundantComment" as const }],
    },
    {
      code: "// Loop through each item\nfor (const item of items) {\n  processItem(item);\n}",
      errors: [{ messageId: "redundantComment" as const }],
    },
    {
      code: "// Iterate over item keys\nfor (const key in item) {\n  processKey(key);\n}",
      errors: [{ messageId: "redundantComment" as const }],
    },
    {
      code: "// Process remaining jobs\nwhile (hasJobs()) {\n  processJob();\n}",
      errors: [{ messageId: "redundantComment" as const }],
    },
    {
      code: "// Create the API client\nconst client = createClient();",
      errors: [{ messageId: "redundantComment" as const }],
    },
    {
      code: "// Send the webhook\napi.sendWebhook(payload);",
      errors: [{ messageId: "redundantComment" as const }],
    },
    {
      code: "// Send the webhook\napi['sendWebhook'](payload);",
      errors: [{ messageId: "redundantComment" as const }],
    },
    {
      code: "async function run() {\n  // Save the user\n  await saveUser(user);\n}",
      errors: [{ messageId: "redundantComment" as const }],
    },
  ],
});
