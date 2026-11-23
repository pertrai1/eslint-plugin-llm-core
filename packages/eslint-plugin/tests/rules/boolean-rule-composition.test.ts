import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TSESLint } from "@typescript-eslint/utils";
import tseslint from "typescript-eslint";
import { expect, it } from "vitest";
import noRedundantLogic from "../../src/rules/no-redundant-logic";

it("allows an explicit optional boolean check without weakening either rule", () => {
  const root = mkdtempSync(join(tmpdir(), "llm-core-boolean-"));
  const filename = "command.ts";
  const code = [
    "interface Command { secret?: boolean }",
    "function check(command: Command | undefined, count: number) {",
    "  if (command?.secret) {}",
    "  if (command?.secret === true) {}",
    "  const known = count > 0;",
    "  if (known === true) {}",
    "}",
  ].join("\n");

  try {
    writeFileSync(
      join(root, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { strict: true }, files: [filename] }),
    );
    writeFileSync(join(root, filename), code);
    const messages = new TSESLint.Linter({ cwd: root }).verify(
      code,
      [
        {
          files: ["**/*.ts"],
          languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
              project: "./tsconfig.json",
              tsconfigRootDir: root,
            },
          },
          plugins: {
            "@typescript-eslint": tseslint.plugin,
            "llm-core": { rules: { "no-redundant-logic": noRedundantLogic } },
          },
          rules: {
            "@typescript-eslint/strict-boolean-expressions": [
              "error",
              { allowNullableBoolean: false },
            ],
            "llm-core/no-redundant-logic": "error",
          },
        },
      ],
      { filename },
    );

    expect(
      messages.map(({ line, ruleId, messageId }) => ({
        line,
        ruleId,
        messageId,
      })),
    ).toEqual([
      {
        line: 3,
        ruleId: "@typescript-eslint/strict-boolean-expressions",
        messageId: "conditionErrorNullableBoolean",
      },
      {
        line: 6,
        ruleId: "llm-core/no-redundant-logic",
        messageId: "redundantBooleanComparison",
      },
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
