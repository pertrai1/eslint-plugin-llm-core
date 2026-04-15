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
});
