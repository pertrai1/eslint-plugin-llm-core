import { describe, expect, it } from "vitest";
import { interpolateInstruction } from "../../src/instructions/config-resolver";

describe("interpolateInstruction", () => {
  it("interpolates a single configured option into the principle", () => {
    expect(
      interpolateInstruction(
        {
          principle:
            "Keep functions under {max} lines — extract helpers when they grow",
        },
        { max: 40 },
      ),
    ).toBe("Keep functions under 40 lines — extract helpers when they grow");
  });

  it("uses optionTemplate when multiple options are configured", () => {
    expect(
      interpolateInstruction(
        {
          principle:
            "Limit function parameters to {max} — use object parameter patterns when more are needed",
          optionTemplate:
            "Limit function parameters to {max} (constructors: {maxConstructor}) — use object parameter patterns",
        },
        { max: 3, maxConstructor: 5 },
      ),
    ).toBe(
      "Limit function parameters to 3 (constructors: 5) — use object parameter patterns",
    );
  });

  it("leaves placeholders untouched when multiple options are configured without an optionTemplate", () => {
    expect(
      interpolateInstruction(
        {
          principle:
            "Keep complexity under {max} and constructors under {maxConstructor}",
        },
        { max: 10, maxConstructor: 5 },
      ),
    ).toBe(
      "Keep complexity under {max} and constructors under {maxConstructor}",
    );
  });

  it("renders array options as comma-separated values", () => {
    expect(
      interpolateInstruction(
        {
          principle: "Extract named constants for all magic numbers",
          optionTemplate:
            "Extract named constants for magic numbers (ignore: {ignore})",
        },
        { ignore: [5, 10, 15] },
      ),
    ).toBe("Extract named constants for magic numbers (ignore: 5, 10, 15)");
  });

  it("returns the principle as-is when no options are configured", () => {
    expect(
      interpolateInstruction(
        {
          principle: "Never use type assertions to 'any'",
        },
        {},
      ),
    ).toBe("Never use type assertions to 'any'");
  });
});
