import tsParser from "@typescript-eslint/parser";
import { TSESLint } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";
import plugin from "../../src/index";
import noChainedTypeAssertions from "../../src/rules/no-chained-type-assertions";
import noKnownValueWidening from "../../src/rules/no-known-value-widening";
import noObjectParameters from "../../src/rules/no-object-parameters";
import noTypeSystemBypass from "../../src/rules/no-type-system-bypass";
import noUnknownParameters from "../../src/rules/no-unknown-parameters";
import noUnknownReturns from "../../src/rules/no-unknown-returns";
import noUnknownTypeAliases from "../../src/rules/no-unknown-type-aliases";
import noUnsafeDictionaryType from "../../src/rules/no-unsafe-dictionary-type";

const AFTER_PREFIX = "  After:  ";
const CONTINUATION_PREFIX = "          ";

const messages: [label: string, message: string][] = [
  ["no-chained-type-assertions", noChainedTypeAssertions.meta.messages.chained],
  ["no-known-value-widening", noKnownValueWidening.meta.messages.widening],
  ["no-object-parameters", noObjectParameters.meta.messages.objectParameter],
  ["no-unknown-parameters", noUnknownParameters.meta.messages.unknownParameter],
  ["no-unknown-returns", noUnknownReturns.meta.messages.unknownReturn],
  ["no-unknown-type-aliases", noUnknownTypeAliases.meta.messages.unknownAlias],
  [
    "no-unsafe-dictionary-type",
    noUnsafeDictionaryType.meta.messages.unsafeDictionary,
  ],
  [
    "no-type-system-bypass tsIgnoreDirective",
    noTypeSystemBypass.meta.messages.tsIgnoreDirective,
  ],
  [
    "no-type-system-bypass doubleAssertion",
    noTypeSystemBypass.meta.messages.doubleAssertion,
  ],
  [
    "no-type-system-bypass nonNullAssertion",
    noTypeSystemBypass.meta.messages.nonNullAssertion,
  ],
  [
    "no-type-system-bypass explicitAny",
    noTypeSystemBypass.meta.messages.explicitAny,
  ],
];

// Collects each "After:" example, including its indented continuation lines.
function afterExamples(message: string): string[] {
  const examples: string[] = [];
  for (const line of message.split("\n")) {
    if (line.startsWith(AFTER_PREFIX)) {
      examples.push(line.slice(AFTER_PREFIX.length));
    } else if (line.startsWith(CONTINUATION_PREFIX) && examples.length > 0) {
      examples[examples.length - 1] +=
        `\n${line.slice(CONTINUATION_PREFIX.length)}`;
    }
  }
  return examples;
}

function lintWithRecommended(code: string): string[] {
  const config: TSESLint.Linter.ConfigType = [
    ...(plugin.configs.recommended ?? []),
    { files: ["**/*.ts"], languageOptions: { parser: tsParser } },
  ];
  return new TSESLint.Linter()
    .verify(code, config, { filename: "example.ts" })
    .map((message) => `${message.ruleId}: ${message.message.split("\n")[0]}`);
}

describe("TypeScript rule messages follow the lint-message template", () => {
  it.each(messages)(
    "%s separates what, why, and how-to-fix with blank lines",
    (_label, message) => {
      const lines = message.split("\n");

      expect(lines[1]).toBe("");
      expect(lines[2]?.startsWith("Why: ")).toBe(true);
      expect(lines[lines.indexOf("How to fix:") - 1]).toBe("");
    },
  );

  it.each(messages)(
    "%s shows a Before line and at least one After line",
    (_label, message) => {
      const lines = message.split("\n");

      expect(
        lines.filter((line) => line.startsWith("  Before: ")),
      ).toHaveLength(1);
      expect(afterExamples(message).length).toBeGreaterThanOrEqual(1);
    },
  );

  it.each(messages)(
    "%s only recommends After code that the recommended config accepts",
    (_label, message) => {
      for (const example of afterExamples(message)) {
        expect(lintWithRecommended(example)).toEqual([]);
      }
    },
  );
});

describe("lintWithRecommended", () => {
  it("reports the rules a double assertion breaks, so a clean result is meaningful", () => {
    expect(
      lintWithRecommended("const user = data as unknown as User;"),
    ).toEqual([
      "llm-core/no-chained-type-assertions: This assertion chain discards type evidence.",
      "llm-core/no-type-system-bypass: Avoid double assertions through `unknown` — they bypass TypeScript's structural checks.",
    ]);
  });
});

describe("TypeScript rule messages avoid undefined vocabulary", () => {
  it.each(messages)("%s does not use the term 'owner'", (_label, message) => {
    expect(message).not.toContain("owner");
  });
});
