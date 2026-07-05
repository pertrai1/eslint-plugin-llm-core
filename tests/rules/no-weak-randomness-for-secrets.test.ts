import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-weak-randomness-for-secrets";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-weak-randomness-for-secrets", rule, {
  valid: [
    // Cryptographic Node randomness is appropriate for secrets.
    `import { randomBytes, randomUUID } from "node:crypto";

    const token = randomBytes(32).toString("hex");
    const sessionId = randomUUID();`,

    // Browser cryptographic randomness is also valid.
    `const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const resetCode = encode(bytes);`,

    // Math.random is allowed for non-security-sensitive values by default.
    `const displayJitter = Math.random() * 100;`,

    // Timestamps are fine when not used for sensitive values.
    `const cacheBustTimestamp = Date.now();`,

    // Non-sensitive property assignments should not be reported.
    `chart.animationDelay = Math.random() * 250;`,

    // Custom options can define a project-specific sensitive name vocabulary.
    {
      code: `const inviteCode = Math.random().toString(36);`,
      options: [{ sensitiveNamePattern: "sessionOnly" }],
    },
  ],

  invalid: [
    // Math.random is predictable and should not back auth tokens.
    {
      code: `const token = Math.random().toString(36).slice(2);`,
      errors: [{ messageId: "weakRandomnessForSecret" as const }],
    },

    // Timestamp-plus-random session IDs are still predictable.
    {
      code: `const sessionId = Date.now() + "-" + Math.random();`,
      errors: [{ messageId: "weakRandomnessForSecret" as const }],
    },

    // Numeric reset codes generated from Math.random are guessable.
    {
      code: `const passwordResetCode = Math.floor(Math.random() * 1_000_000).toString();`,
      errors: [{ messageId: "weakRandomnessForSecret" as const }],
    },

    // Timestamps and counters should not be used for nonces.
    {
      code: "let counter = 0;\nconst nonce = `${Date.now()}-${counter++}`;",
      errors: [{ messageId: "weakRandomnessForSecret" as const }],
    },

    // Sensitive property assignment is covered, not just variable declarations.
    {
      code: `user.apiKey = Math.random().toString(36);`,
      errors: [{ messageId: "weakRandomnessForSecret" as const }],
    },

    // Sensitive object properties are covered when assembling records.
    {
      code: `const credentials = {
        secret: new Date().getTime().toString(36),
      };`,
      errors: [{ messageId: "weakRandomnessForSecret" as const }],
    },

    // Sensitive function names should not return weak randomness.
    {
      code: `function generateToken() {
        return Math.random().toString(36).slice(2);
      }`,
      errors: [{ messageId: "weakRandomnessForSecret" as const }],
    },

    // The sensitive-name pattern is configurable.
    {
      code: `const inviteCode = Math.random().toString(36);`,
      options: [{ sensitiveNamePattern: "inviteCode" }],
      errors: [{ messageId: "weakRandomnessForSecret" as const }],
    },

    // Projects can opt into banning Math.random even for non-sensitive names.
    {
      code: `const displayJitter = Math.random() * 100;`,
      options: [{ allowMathRandomForNonSensitiveNames: false }],
      errors: [{ messageId: "weakRandomnessForSecret" as const }],
    },
  ],
});
