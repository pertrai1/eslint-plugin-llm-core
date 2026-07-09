import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-commented-out-code";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-commented-out-code", rule, {
  valid: [
    // Regular prose comments
    "// This function handles authentication",
    "// Check if the user is valid before proceeding",

    // TODO/FIXME comments
    "// TODO: refactor this later",
    "// FIXME: handle edge case",
    "// HACK: temporary workaround",
    "// NOTE: this is intentional",

    // JSDoc comments
    `/** 
     * @param {string} name - The user's name
     * @returns {boolean} Whether the user is valid
     */
    function isValid(name: string): boolean { return true; }`,

    // TypeScript directive comments
    "// @ts-expect-error intentional",
    "// @ts-ignore legacy code",

    // URL comments
    "// See https://example.com/docs for details",

    // Short comments
    "// ok",
    "// no",

    // Comments with code-like words but in prose context
    "// The variable should be const when possible",
    "// We need to return early if the data is invalid",

    // Empty comments
    "//",
    "/* */",

    // Block comments that are JSDoc
    `/**
     * import { something } from 'somewhere';
     * const x = 5;
     */
    const a = 1;`,
  ],

  invalid: [
    // Single line comment with variable declaration
    {
      code: "// const oldValue = computeValue();",
      errors: [{ messageId: "noCommentedOutCode" as const }],
    },

    // Single line comment with function call and semicolon
    {
      code: "// processData(items);",
      errors: [{ messageId: "noCommentedOutCode" as const }],
    },

    // Consecutive line comments with code
    {
      code: `// const config = getConfig();
// if (config.enabled) {
//   processData(config);
// }`,
      errors: [{ messageId: "noCommentedOutCode" as const }],
    },

    // Block comment with code
    {
      code: `/* const oldImplementation = () => {
  return fetchData();
}; */`,
      errors: [{ messageId: "noCommentedOutCode" as const }],
    },

    // Import statement
    {
      code: '// import { something } from "module";',
      errors: [{ messageId: "noCommentedOutCode" as const }],
    },

    // Export statement
    {
      code: "// export function oldHandler() {}",
      errors: [{ messageId: "noCommentedOutCode" as const }],
    },

    // If statement
    {
      code: "// if (shouldProcess) {",
      errors: [{ messageId: "noCommentedOutCode" as const }],
    },

    // Assignment with semicolon
    {
      code: "// result = transform(data);",
      errors: [{ messageId: "noCommentedOutCode" as const }],
    },

    // Await expression
    {
      code: "// await saveToDatabase(record);",
      errors: [{ messageId: "noCommentedOutCode" as const }],
    },

    // Function declaration
    {
      code: "// function oldHelper(x: number) {",
      errors: [{ messageId: "noCommentedOutCode" as const }],
    },

    // Class declaration
    {
      code: "// class OldService {",
      errors: [{ messageId: "noCommentedOutCode" as const }],
    },

    // Block comment with try-catch
    {
      code: `/*
try {
  await riskyOperation();
} catch (e) {
  handleError(e);
}
*/`,
      errors: [{ messageId: "noCommentedOutCode" as const }],
    },

    // Return statement
    {
      code: "// return processedData;",
      errors: [{ messageId: "noCommentedOutCode" as const }],
    },

    // Throw statement
    {
      code: '// throw new Error("not implemented");',
      errors: [{ messageId: "noCommentedOutCode" as const }],
    },

    // Multiple separate commented-out code blocks
    {
      code: `// const a = 1;
const b = 2;
// const c = 3;`,
      errors: [
        { messageId: "noCommentedOutCode" as const },
        { messageId: "noCommentedOutCode" as const },
      ],
    },
  ],
});
