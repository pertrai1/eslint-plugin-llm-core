import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-dynamic-code-execution";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-dynamic-code-execution", rule, {
  valid: [
    // Dispatch tables make allowed actions explicit without compiling strings.
    `const handlers = { refreshToken, poll } satisfies Record<string, () => void>;
handlers[action]?.();`,

    // Timer callbacks should be functions, not strings.
    `setTimeout(() => refreshToken(), 1000);`,
    `setInterval(function pollAgain() { poll(); }, 5000);`,

    // Object methods named eval are not global dynamic code execution APIs.
    `sandbox.eval(expression);`,

    // Referenced timer callbacks are safe from this rule's narrow string-timer check.
    `setTimeout(refreshToken, 1000);`,
  ],

  invalid: [
    // Direct eval executes strings as code.
    {
      code: `eval(userInput);`,
      errors: [{ messageId: "noDynamicCodeExecution" as const }],
    },

    // Global eval member calls have the same dynamic execution risk.
    {
      code: `window.eval(template);`,
      errors: [{ messageId: "noDynamicCodeExecution" as const }],
    },
    {
      code: `globalThis.eval(template);`,
      errors: [{ messageId: "noDynamicCodeExecution" as const }],
    },

    // Function constructors compile strings into executable functions.
    {
      code: `const fn = new Function("ctx", generatedBody);`,
      errors: [{ messageId: "noDynamicCodeExecution" as const }],
    },
    {
      code: `const fn = Function("return process.env");`,
      errors: [{ messageId: "noDynamicCodeExecution" as const }],
    },
    {
      code: `const fn = globalThis.Function("return process.env")();`,
      errors: [{ messageId: "noDynamicCodeExecution" as const }],
    },

    // String timers compile their first argument as code.
    {
      code: `setTimeout("refreshToken()", 1000);`,
      errors: [{ messageId: "noDynamicCodeExecution" as const }],
    },
    {
      code: "setInterval(`poll()`, 5000);",
      errors: [{ messageId: "noDynamicCodeExecution" as const }],
    },
  ],
});
