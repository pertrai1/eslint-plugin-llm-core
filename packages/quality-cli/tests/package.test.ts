import { describe, expect, it } from "vitest";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";

const PACKAGE_JSON = fileURLToPath(new URL("../package.json", import.meta.url));
const README = fileURLToPath(new URL("../README.md", import.meta.url));

describe("quality CLI package metadata", () => {
  it("wires the llm-core-quality bin to the built CLI", async () => {
    const pkg = JSON.parse(await readFile(PACKAGE_JSON, "utf8")) as {
      bin?: Record<string, string>;
      files?: string[];
    };

    expect(pkg.bin?.["llm-core-quality"]).toBe("dist/cli.js");
    expect(pkg.files).toContain("dist");
  });

  it("declares the initial ESLint, llm-core, and Knip engines", async () => {
    const pkg = JSON.parse(await readFile(PACKAGE_JSON, "utf8")) as {
      dependencies?: Record<string, string>;
    };

    expect(pkg.dependencies).toMatchObject({
      eslint: "^10.1.0",
      "eslint-plugin-llm-core": "0.35.1",
      knip: "^6.26.0",
    });
  });

  it("ships CLI setup documentation", async () => {
    await expect(access(README, constants.R_OK)).resolves.toBeUndefined();

    const readme = await readFile(README, "utf8");
    expect(readme).toContain("llm-core-quality scan --json");
    expect(readme).toContain("llm-core-quality ci");
  });
});
