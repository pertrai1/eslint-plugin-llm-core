import tsParser from "@typescript-eslint/parser";
import { TSESLint } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";
import maxComplexity from "../../src/rules/max-complexity";
import noDynamicCodeExecution from "../../src/rules/no-dynamic-code-execution";
import noExportedFunctionExpressions from "../../src/rules/no-exported-function-expressions";
import noIncorrectSort from "../../src/rules/no-incorrect-sort";
import noInlineDisable from "../../src/rules/no-inline-disable";
import noLlmArtifacts from "../../src/rules/no-llm-artifacts";
import noMagicNumbers from "../../src/rules/no-magic-numbers";
import noRedundantLogic from "../../src/rules/no-redundant-logic";
import noSwallowedErrors from "../../src/rules/no-swallowed-errors";
import noUnboundedPromiseAll from "../../src/rules/no-unbounded-promise-all";
import noUnsafeArrayAccess from "../../src/rules/no-unsafe-array-access";
import preferUnknownInCatch from "../../src/rules/prefer-unknown-in-catch";

type AnyRule = TSESLint.RuleModule<string, readonly unknown[]>;

function lintWith(rule: AnyRule, code: string): string[] {
  const config: TSESLint.Linter.ConfigType = [
    {
      files: ["**/*.ts"],
      languageOptions: { parser: tsParser },
      plugins: { test: { rules: { subject: rule } } },
      rules: { "test/subject": "error" },
    },
  ];
  return new TSESLint.Linter()
    .verify(code, config, { filename: "example.ts" })
    .map((message) => message.messageId ?? message.message);
}

describe("fix guidance steers toward a real fix", () => {
  it("no-unsafe-array-access leads with a guard that changes behaviour, not a ternary that returns the same value", () => {
    const message = noUnsafeArrayAccess.meta.messages.unsafeArrayAccess;

    expect(message).toContain(
      '  After:  if (items.length === 0) throw new Error("items must not be empty");',
    );
    expect(message).not.toContain("items.length > 0 ? items[0] : undefined");
    expect(
      lintWith(
        noUnsafeArrayAccess as AnyRule,
        'function pick(items: string[]): string { if (items.length === 0) throw new Error("items must not be empty"); const first = items[0]; return first; }',
      ),
    ).toEqual([]);
  });

  it("no-inline-disable does not offer editing the ESLint config as a fix", () => {
    const message = noInlineDisable.meta.messages.noInlineDisable;

    expect(message).not.toContain("eslint.config");
    expect(message).toContain(
      "  If the rule is genuinely wrong for this code, say so and let the project owner decide; do not suppress it or change the lint config yourself.",
    );
  });

  it("no-llm-artifacts does not model invented issue numbers or rewording a stub", () => {
    const stub = noLlmArtifacts.meta.messages.notImplementedStub;
    const placeholder = noLlmArtifacts.meta.messages.noLlmArtifact;

    expect(stub).not.toContain("#456");
    expect(stub).toContain(
      "  Do not reword the error to get past this rule. If the function cannot be implemented yet, say so instead of leaving a stub.",
    );
    expect(placeholder).not.toContain("#123");
    expect(placeholder).toContain(
      "  Reference an issue only if it really exists; never invent an issue number.",
    );
  });

  it("no-unbounded-promise-all leads with a dependency-free rewrite the rule accepts", () => {
    const message = noUnboundedPromiseAll.meta.messages.noUnboundedPromiseAll;

    expect(message).toContain(
      "  After:  for (const user of users) { await sendEmail(user); }",
    );
    expect(message).toContain(
      "  After:  for (const batch of batches) { await Promise.all(batch.map((user) => sendEmail(user))); }",
    );
    expect(message).not.toContain("pLimit(5)");
    expect(message).not.toContain("chunks(");
    expect(
      lintWith(
        noUnboundedPromiseAll as AnyRule,
        "async function run(batches: User[][]) { for (const batch of batches) { await Promise.all(batch.map((user) => sendEmail(user))); } }",
      ),
    ).toEqual([]);
  });

  it("no-swallowed-errors does not assume a specific error-reporting vendor", () => {
    const message = noSwallowedErrors.meta.messages.noSwallowedErrors;

    expect(message).not.toContain("Sentry");
    expect(message).toContain(
      "  After:  catch (error) { errorReporter.report(error); }  // the project's existing reporter",
    );
    expect(message).toContain("update its callers");
  });

  it("max-complexity offers helper extraction, which removes branches, and not early returns, which do not", () => {
    const message = maxComplexity.meta.messages.maxComplexity;

    expect(message).toContain(
      "  Otherwise move one group of branches into a named helper so they are counted there. Reordering or un-nesting the same branches does not lower the count.",
    );
    expect(message).not.toContain("return early");
  });

  it("no-magic-numbers does not anchor every constant on MAX_RETRIES", () => {
    const message = noMagicNumbers.meta.messages.noMagicNumber;

    expect(message).not.toContain("MAX_RETRIES");
    expect(message).toContain(
      "  Name the constant for what {{ value }} means here, not for the number itself.",
    );
  });

  it("no-exported-function-expressions uses one placeholder name and says to replace it", () => {
    const message =
      noExportedFunctionExpressions.meta.messages.noDefaultFunctionExpression;

    expect(message).not.toContain("myFunction");
    expect(message).toContain(
      "  Replace `functionName` with a name that says what the function does.",
    );
  });

  it("no-dynamic-code-execution dispatches through a Map, not inherited object keys", () => {
    const message = noDynamicCodeExecution.meta.messages.noDynamicCodeExecution;

    expect(message).toContain("  After:  handlers.get(action)?.()");
    expect(message).not.toContain("handlers[action]");
  });

  it("no-incorrect-sort gives an explicit comparator for plain string ordering", () => {
    const message = noIncorrectSort.meta.messages.noIncorrectSort;

    expect(message).toContain(
      "  For strings in default code-unit order: arr.sort((a, b) => (a < b ? -1 : Number(a > b)))",
    );
    expect(
      lintWith(
        noIncorrectSort as AnyRule,
        "names.sort((a, b) => (a < b ? -1 : Number(a > b)));",
      ),
    ).toEqual([]);
  });

  it("prefer-unknown-in-catch keeps the narrowing examples but drops the reusable-helper block", () => {
    const message = preferUnknownInCatch.meta.messages.preferUnknownInCatch;

    expect(message).toContain("'code' in error");
    expect(message).not.toContain("toError");
    expect(message.split("\n").length).toBeLessThanOrEqual(30);
  });

  it("no-redundant-logic's headline matches its fix", () => {
    const message = noRedundantLogic.meta.messages.redundantBooleanComparison;

    expect(message.split("\n")[0]).toBe(
      "Redundant comparison to boolean literal — use the expression directly.",
    );
  });
});
