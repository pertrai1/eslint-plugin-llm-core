import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-llm-artifacts";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-llm-artifacts", rule, {
  valid: [
    // Regular comments
    "// This function handles authentication",
    "// Check if the user is valid before proceeding",

    // TODO/FIXME that are specific (not lazy placeholders)
    "// TODO: add caching for user lookups (see #123)",
    "// FIXME: race condition when concurrent writes happen",

    // Normal code
    "const x = 1;",
    "function foo() { return 42; }",

    // Legitimate throws with real error messages
    `function notSupported() { throw new Error("XML format is not supported"); }`,
    `function validate() { throw new Error("Invalid input: expected string"); }`,

    // Function with throw plus other statements
    `function process(x: number) {
      if (x < 0) throw new Error("Not implemented for negative numbers");
      return x * 2;
    }`,
  ],

  invalid: [
    // Ellipsis placeholders
    {
      code: "// ... existing code ...",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    {
      code: "// ...existing code...",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    {
      code: "// ... rest of the code ...",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    // "remains the same" pattern
    {
      code: "// rest of the function remains the same",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    {
      code: "// the rest remains the same",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    // Lazy TODO/implement placeholders
    {
      code: "// TODO: implement",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    {
      code: "// TODO: implement this",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    {
      code: "// TODO implement",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    // Block comment placeholders
    {
      code: "/* ... existing code ... */",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    {
      code: `/* 
        ... rest of the code ...
      */`,
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    // "add implementation" / "your code here" patterns
    {
      code: "// Add implementation here",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    {
      code: "// your code here",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    {
      code: "// implementation goes here",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    // "add X as needed" patterns
    {
      code: "// add error handling as needed",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    {
      code: "// add more cases as needed",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    // "abbreviated/omitted for brevity/clarity" patterns
    {
      code: "// abbreviated for brevity",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    {
      code: "// omitted for clarity",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    {
      code: "// truncated for brevity",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    // "similar to above" / "same as before"
    {
      code: "// similar to above",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    {
      code: "// same as before",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    {
      code: "// same pattern as above",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
    // Stub function bodies: throw "not implemented"
    {
      code: `function processData() {
  throw new Error("Not implemented");
}`,
      errors: [{ messageId: "notImplementedStub" as const }],
    },
    {
      code: `function processData() {
  throw new Error("not implemented yet");
}`,
      errors: [{ messageId: "notImplementedStub" as const }],
    },
    {
      code: `const handler = () => {
  throw new Error("TODO: implement");
}`,
      errors: [{ messageId: "notImplementedStub" as const }],
    },
    // FunctionExpression stub
    {
      code: `const handler = function() {
  throw new Error("Not implemented");
}`,
      errors: [{ messageId: "notImplementedStub" as const }],
    },
    // Long placeholder comment (triggers truncation)
    {
      code: "// ... existing code that was here before the refactor and should be restored ...",
      errors: [{ messageId: "noLlmArtifact" as const }],
    },
  ],
});
