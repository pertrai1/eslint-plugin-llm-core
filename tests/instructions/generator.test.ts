import { describe, expect, it } from "vitest";
import { generateMarkdown } from "../../src/instructions/generator";
import type { ResolvedRule } from "../../src/instructions/types";

const allFilesRule: ResolvedRule = {
  name: "max-function-length",
  instruction: "Keep functions under 50 lines — extract helpers when they grow",
  scope: "all",
};

const typescriptRule: ResolvedRule = {
  name: "explicit-export-types",
  instruction:
    "Add explicit parameter and return type annotations on all exported functions",
  scope: "typescript-only",
};

describe("generateMarkdown", () => {
  it("renders all-files and TypeScript-only rule sections", () => {
    expect(generateMarkdown([allFilesRule, typescriptRule])).toBe(
      `
# Coding Guidelines

Generated from eslint-plugin-llm-core configuration.
Regenerate with: npx generate-instructions

## All Files

- Keep functions under 50 lines — extract helpers when they grow

## TypeScript Files Only

- Add explicit parameter and return type annotations on all exported functions
`.trimStart(),
    );
  });

  it("omits the TypeScript-only section when there are no TS-only rules", () => {
    expect(generateMarkdown([allFilesRule])).toBe(
      `
# Coding Guidelines

Generated from eslint-plugin-llm-core configuration.
Regenerate with: npx generate-instructions

## All Files

- Keep functions under 50 lines — extract helpers when they grow
`.trimStart(),
    );
  });

  it("renders the document header even when there are no active rules", () => {
    expect(generateMarkdown([])).toBe(
      `
# Coding Guidelines

Generated from eslint-plugin-llm-core configuration.
Regenerate with: npx generate-instructions
`.trimStart(),
    );
  });
});
