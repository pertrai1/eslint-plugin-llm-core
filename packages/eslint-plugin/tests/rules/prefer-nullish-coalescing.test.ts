import { RuleTester } from "@typescript-eslint/rule-tester";
import { TSESLint } from "@typescript-eslint/utils";
import { runInNewContext } from "node:vm";
import rule from "../../src/rules/prefer-nullish-coalescing";
import { describe, it, afterAll, expect } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

const predicateConfig: TSESLint.Linter.ConfigType = [
  {
    languageOptions: { sourceType: "commonjs" },
    plugins: { test: { rules: { predicate: rule } } },
    rules: { "test/predicate": "error" },
  },
];

describe("built-in predicate OR semantics", () => {
  it("checks prototype exposure even when a constructor global is unresolved", () => {
    const config: TSESLint.Linter.ConfigType = [
      ...predicateConfig,
      { languageOptions: { globals: { Set: "off" } } },
    ];
    const code = "return new Set().has(name) || fallback();";
    expect(new TSESLint.Linter().verify(code, config)).toEqual([]);
    const messages = new TSESLint.Linter().verify(
      "Set.prototype.has = custom; " + code,
      config,
    );
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe("preferNullishCoalescing");
    expect(messages[0]?.suggestions?.[0]?.fix.text).toBe("??");
  });

  it.each([
    [
      "Set.prototype.has = custom; return new Set().has(name) || fallback();",
      "Set.prototype.has = custom; return new Set().has(name) ?? fallback();",
    ],
    [
      "RegExp.prototype.test = custom; return /x/.test(name) || fallback();",
      "RegExp.prototype.test = custom; return /x/.test(name) ?? fallback();",
    ],
    [
      "String.prototype.endsWith = custom; return 'x'.endsWith(name) || fallback();",
      "String.prototype.endsWith = custom; return 'x'.endsWith(name) ?? fallback();",
    ],
    [
      "[globalThis.Set] = [custom]; return new Set().has(name) || fallback();",
      "[globalThis.Set] = [custom]; return new Set().has(name) ?? fallback();",
    ],
    [
      "({ x: globalThis.Set } = source); return new Set().has(name) || fallback();",
      "({ x: globalThis.Set } = source); return new Set().has(name) ?? fallback();",
    ],
    [
      "for (globalThis.Set of values) {} return new Set().has(name) || fallback();",
      "for (globalThis.Set of values) {} return new Set().has(name) ?? fallback();",
    ],
    [
      "for (globalThis.Set in values) {} return new Set().has(name) || fallback();",
      "for (globalThis.Set in values) {} return new Set().has(name) ?? fallback();",
    ],
    [
      "globalThis.Set = custom; return new Set().has(name) || fallback();",
      "globalThis.Set = custom; return new Set().has(name) ?? fallback();",
    ],
    [
      "globalThis.RegExp = custom; return new RegExp().test(name) || fallback();",
      "globalThis.RegExp = custom; return new RegExp().test(name) ?? fallback();",
    ],
    [
      "globalThis.String = custom; return new String().endsWith(name) || fallback();",
      "globalThis.String = custom; return new String().endsWith(name) ?? fallback();",
    ],
    [
      "global.Set = custom; return new Set().has(name) || fallback();",
      "global.Set = custom; return new Set().has(name) ?? fallback();",
    ],
    [
      "window.Set = custom; return new Set().has(name) || fallback();",
      "window.Set = custom; return new Set().has(name) ?? fallback();",
    ],
    [
      "self.Set = custom; return new Set().has(name) || fallback();",
      "self.Set = custom; return new Set().has(name) ?? fallback();",
    ],
    [
      "function f(Set) { return new Set().has(name) || fallback(); }",
      "function f(Set) { return new Set().has(name) ?? fallback(); }",
    ],
    [
      "function f(RegExp) { return new RegExp().test(name) || fallback(); }",
      "function f(RegExp) { return new RegExp().test(name) ?? fallback(); }",
    ],
    [
      "function f(String) { return new String().endsWith(name) || fallback(); }",
      "function f(String) { return new String().endsWith(name) ?? fallback(); }",
    ],
    [
      "const names = { has() { return 0; } }; return names.has(name) || fallback();",
      "const names = { has() { return 0; } }; return names.has(name) ?? fallback();",
    ],
    [
      "const pattern = { test() { return null; } }; return pattern.test(name) || fallback();",
      "const pattern = { test() { return null; } }; return pattern.test(name) ?? fallback();",
    ],
    [
      'const value = { endsWith() { return ""; } }; return input || value.endsWith(name);',
      'const value = { endsWith() { return ""; } }; return input ?? value.endsWith(name);',
    ],
    [
      "let names = new Set(); names = custom; return names.has(name) || fallback();",
      "let names = new Set(); names = custom; return names.has(name) ?? fallback();",
    ],
    [
      "const names = new Set(); names.has = custom; return names.has(name) || fallback();",
      "const names = new Set(); names.has = custom; return names.has(name) ?? fallback();",
    ],
    [
      "const names = new Set(); const alias = names; alias.has = custom; return names.has(name) || fallback();",
      "const names = new Set(); const alias = names; alias.has = custom; return names.has(name) ?? fallback();",
    ],
    [
      "const pattern = /x/; change(pattern); return pattern.test(name) || fallback();",
      "const pattern = /x/; change(pattern); return pattern.test(name) ?? fallback();",
    ],
    ["return input || custom.has(name);", "return input ?? custom.has(name);"],
    [
      "return input || custom.test(name);",
      "return input ?? custom.test(name);",
    ],
    [
      "return input || custom.endsWith(name);",
      "return input ?? custom.endsWith(name);",
    ],
  ])("retains fallback policy without built-in proof: %s", (code, expected) => {
    const messages = new TSESLint.Linter().verify(code, predicateConfig);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe("preferNullishCoalescing");
    const fix = messages[0]!.suggestions![0]!.fix;
    expect(
      code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1]),
    ).toBe(expected);
  });

  it.each([
    ["exact_trace_id", true, true, true],
    ["exact", true, false, true],
    ["custom_trace_id", false, true, true],
    ["other", false, false, false],
  ])(
    "preserves initializer predicates for %s",
    (name, left, right, expected) => {
      const code = `
      const knownNames = new Set(["exact", "exact_trace_id"]);
      const suffixPattern = /_trace_id$/;
      const name = ${JSON.stringify(name)};
      const matches = knownNames.has(name) || suffixPattern.test(name);
      const technical = knownNames.has(name) || name.endsWith("_trace_id");
      [knownNames.has(name), suffixPattern.test(name), name.endsWith("_trace_id"), matches, technical];
    `;
      expect(new TSESLint.Linter().verify(code, predicateConfig)).toEqual([]);
      expect(runInNewContext(code)).toEqual([
        left,
        right,
        right,
        expected,
        expected,
      ]);
    },
  );

  it.each([
    ["exact_trace_id", true],
    ["exact", true],
    ["custom_trace_id", true],
    ["other", false],
  ])("preserves return predicates for %s", (name, expected) => {
    const code = `
      function matches(name) {
        const knownNames = new Set(["exact", "exact_trace_id"]);
        const suffixPattern = /_trace_id$/;
        return knownNames.has(name) || suffixPattern.test(name);
      }
      function technical(name) {
        const knownNames = new Set(["exact", "exact_trace_id"]);
        return knownNames.has(name) || name.endsWith("_trace_id");
      }
      [matches(${JSON.stringify(name)}), technical(${JSON.stringify(name)})];
    `;
    expect(new TSESLint.Linter().verify(code, predicateConfig)).toEqual([]);
    expect(runInNewContext(code)).toEqual([expected, expected]);
  });
});

ruleTester.run("prefer-nullish-coalescing", rule, {
  valid: [
    `String.fromCharCode(120); return 'x'.endsWith(name) || fallback();`,
    `const RegExp = custom; RegExp.prototype.test = customTest; return /x/.test(name) || fallback();`,
    // Unrelated reads and a locally shadowed global-object name do not taint constructors.
    `globalThis.console.log('x'); return new Set().has(name) || fallback();`,
    `const globalThis = {}; globalThis.Set = custom; return new Set().has(name) || fallback();`,
    // Actual built-in predicates are boolean even without boolean-like names.
    `const knownNames = new Set(); const suffixPattern = /_token$/; const name = 'custom_token'; const matches = knownNames.has(name) || suffixPattern.test(name);`,
    `const names = new Set(input); return names.has(name) || name.endsWith('_trace_id');`,
    `return new Set(input).has(name) || fallback();`,
    `return /_token$/.test(name) || fallback();`,
    `const pattern = new RegExp(input); return pattern.test(name) || fallback();`,
    `const name = 'x'; consume(name); return name.endsWith('x') || fallback();`,
    `return input || 'x'.endsWith('x');`,
    'const name = `prefix-${input}`; return name.endsWith("x") || fallback();',
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
