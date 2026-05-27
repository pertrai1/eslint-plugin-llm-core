import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const PACKAGE_JSON = fileURLToPath(new URL("../package.json", import.meta.url));

describe("MCP package metadata", () => {
  it("uses a publishable dependency range for the core plugin", async () => {
    const pkg = JSON.parse(await readFile(PACKAGE_JSON, "utf8")) as {
      dependencies?: Record<string, string>;
    };

    expect(pkg.dependencies?.["eslint-plugin-llm-core"]).toBe("0.24.0");
  });
});
