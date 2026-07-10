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
        compact: false,
        color: "auto",
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
        compact: false,
        color: "auto",
      },
    });
  });

  it("parses compact machine output and explicit color flags", () => {
    expect(parseCliArgs(["scan", "--json", "--compact"], "/repo")).toEqual({
      kind: "run",
      options: {
        command: "scan",
        reporter: "json",
        cwd: "/repo",
        targets: [],
        engines: ["eslint", "knip"],
        failOnFindings: false,
        compact: true,
        color: "auto",
      },
    });

    expect(parseCliArgs(["scan", "--color"], "/repo")).toMatchObject({
      kind: "run",
      options: { color: "always" },
    });

    expect(parseCliArgs(["scan", "--no-color"], "/repo")).toMatchObject({
      kind: "run",
      options: { color: "never" },
    });
  });

  it("trims comma-separated engine names", () => {
    const parsed = parseCliArgs(["scan", "--engine", "eslint, knip"], "/repo");

    expect(parsed).toEqual({
      kind: "run",
      options: {
        command: "scan",
        reporter: "text",
        cwd: "/repo",
        targets: [],
        engines: ["eslint", "knip"],
        failOnFindings: false,
        compact: false,
        color: "auto",
      },
    });
  });

  it("rejects unknown engines", () => {
    expect(() => parseCliArgs(["scan", "--engine", "oxlint"], "/repo")).toThrow(
      "Unknown engine: oxlint",
    );
  });
});
