import { describe, expect, it, vi } from "vitest";
import { generateInstructions } from "../../src/generate-instructions";

vi.mock("../../src/instructions/config-resolver", () => ({
  resolveActiveRules: vi.fn().mockResolvedValue([
    {
      name: "max-function-length",
      instruction: "Keep functions under 50 lines",
      scope: "javascript-only",
    },
    {
      name: "explicit-export-types",
      instruction: "Add explicit export types",
      scope: "typescript-only",
    },
  ]),
}));

describe("generateInstructions", () => {
  it("groups JavaScript-only rules in the public result", async () => {
    await expect(generateInstructions()).resolves.toMatchObject({
      javascriptRules: [
        {
          name: "max-function-length",
          instruction: "Keep functions under 50 lines",
          scope: "javascript-only",
        },
      ],
    });
  });
});
