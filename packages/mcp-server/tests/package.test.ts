import { describe, expect, it } from "vitest";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";

const PACKAGE_JSON = fileURLToPath(new URL("../package.json", import.meta.url));
const README = fileURLToPath(new URL("../README.md", import.meta.url));

describe("MCP package metadata", () => {
  it("uses a publishable dependency range for the core plugin", async () => {
    const pkg = JSON.parse(await readFile(PACKAGE_JSON, "utf8")) as {
      dependencies?: Record<string, string>;
    };

    expect(pkg.dependencies?.["eslint-plugin-llm-core"]).toBe("0.24.0");
  });

  it("wires the llm-core-mcp bin to the built stdio server", async () => {
    const pkg = JSON.parse(await readFile(PACKAGE_JSON, "utf8")) as {
      bin?: Record<string, string>;
      files?: string[];
    };

    expect(pkg.bin?.["llm-core-mcp"]).toBe("./dist/server.js");
    expect(pkg.files).toContain("dist");
  });

  it("ships package-level setup documentation", async () => {
    await expect(access(README, constants.R_OK)).resolves.toBeUndefined();

    const readme = await readFile(README, "utf8");
    expect(readme).toContain("eslint-plugin-llm-core-mcp");
    expect(readme).toContain('"command": "npx"');
    expect(readme).toContain('"eslint-plugin-llm-core-mcp"');
  });
});
