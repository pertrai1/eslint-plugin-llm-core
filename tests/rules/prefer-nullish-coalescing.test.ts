import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/prefer-nullish-coalescing";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("prefer-nullish-coalescing", rule, {
  valid: [
    // Already preserves valid falsy values.
    `const name = input ?? "Unknown";`,
    `const count = value ?? 10;`,

    // Boolean OR in control-flow conditions is not a default value.
    `if (isReady || isForced) { run(); }`,
    `while (hasNext || shouldRetry) { retry(); }`,

    // Boolean expressions should remain logical OR.
    `const isAllowed = isAdmin || isOwner;`,
    `return isCached || isFresh;`,
    `return flags.isReady || computeDefault();`,
    `return user?.hasAccess || computeDefault();`,
    `return user?.hasAccess() || computeDefault();`,
    `const access = user.hasAccess || request.canBypass;`,

    // Boolean fallbacks intentionally coerce/choose boolean values.
    `const enabled = config.enabled || false;`,
    `const visible = props.visible || true;`,

    // Avoid suggestions that would mix ?? with ||/&& without parentheses.
    `const value = input || cached || "fallback";`,
    `const value = (input && cached) || "fallback";`,
  ],

  invalid: [
    {
      code: `const name = input || "Unknown";`,
      errors: [
        {
          messageId: "preferNullishCoalescing" as const,
          suggestions: [
            {
              messageId: "useNullishCoalescing" as const,
              output: `const name = input ?? "Unknown";`,
            },
          ],
        },
      ],
    },
    {
      code: `const count = value || 10;`,
      errors: [
        {
          messageId: "preferNullishCoalescing" as const,
          suggestions: [
            {
              messageId: "useNullishCoalescing" as const,
              output: `const count = value ?? 10;`,
            },
          ],
        },
      ],
    },
    {
      code: `options.timeout = options.timeout || 5000;`,
      errors: [
        {
          messageId: "preferNullishCoalescing" as const,
          suggestions: [
            {
              messageId: "useNullishCoalescing" as const,
              output: `options.timeout = options.timeout ?? 5000;`,
            },
          ],
        },
      ],
    },
    {
      code: `return cachedValue || computeDefault();`,
      errors: [
        {
          messageId: "preferNullishCoalescing" as const,
          suggestions: [
            {
              messageId: "useNullishCoalescing" as const,
              output: `return cachedValue ?? computeDefault();`,
            },
          ],
        },
      ],
    },
  ],
});
