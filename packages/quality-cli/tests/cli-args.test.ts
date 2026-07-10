import { describe, expect, it } from "vitest";

import { parseCliArgs } from "../src/index.js";

describe("parseCliArgs", () => {
  it("defaults scan to text output and non-failing findings", () => {
    const parsed = parseCliArgs(["scan", "src"], "/repo");

    expect(parsed).toEqual({
      kind: "run",
      options: {
        command: "scan",
        reporter: "text",
        cwd: "/repo",
        targets: ["src"],
        engines: ["eslint", "knip"],
        failOnFindings: false,
      },
    });
  });

  it("parses ci SARIF mode with a single engine", () => {
    const parsed = parseCliArgs(
      ["ci", "--sarif", "--engine", "eslint"],
      "/repo",
    );

    expect(parsed).toEqual({
      kind: "run",
      options: {
        command: "ci",
        reporter: "sarif",
        cwd: "/repo",
        targets: [],
        engines: ["eslint"],
        failOnFindings: true,
      },
    });
  });

  it("rejects unknown engines", () => {
    expect(() => parseCliArgs(["scan", "--engine", "oxlint"], "/repo")).toThrow(
      "Unknown engine: oxlint",
    );
  });
});
