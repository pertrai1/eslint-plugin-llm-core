import { afterEach, describe, expect, it, vi } from "vitest";

import { shouldUseColor } from "../src/color.js";
import type { QualityScanOptions } from "../src/types.js";

describe("shouldUseColor", () => {
  const originalEnv = { ...process.env };
  const originalIsTty = process.stdout.isTTY;

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: originalIsTty,
    });
  });

  it("honors explicit color flags", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    expect(shouldUseColor(optionsWithColor("always"))).toBe(true);
    expect(shouldUseColor(optionsWithColor("never"))).toBe(false);
  });

  it("disables auto color when NO_COLOR is present, even when empty", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: true,
    });
    process.env.NO_COLOR = "";
    delete process.env.CI;

    expect(shouldUseColor(optionsWithColor("auto"))).toBe(false);
  });

  it("disables auto color for enabled CI values", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: true,
    });
    delete process.env.NO_COLOR;
    process.env.CI = "1";

    expect(shouldUseColor(optionsWithColor("auto"))).toBe(false);
  });
});

function optionsWithColor(
  color: QualityScanOptions["color"],
): QualityScanOptions {
  return {
    color,
    command: "scan",
    reporter: "text",
    cwd: "/repo",
    targets: [],
    engines: ["eslint"],
    failOnFindings: false,
    compact: false,
    production: false,
  };
}
