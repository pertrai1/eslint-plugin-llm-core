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
    "// eslint-disable-next-line no-console\nconsole.log(value);",
    "// Important: normalize Turkish dotted I before slug comparison\nconst slug = normalizeSlug(input);",
    "// This branch handles the retry path after a 429 response\nif (shouldRetry(response)) { retry(); }",
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
      code: "// Process each item\nfor (const item of items) {\n  processItem(item);\n}",
      errors: [{ messageId: "redundantComment" as const }],
    },
  ],
});
