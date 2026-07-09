import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface PackageJson {
  private?: boolean;
  scripts?: Record<string, string>;
}

async function readPackageJson(
  pathFromPackageRoot = "package.json",
): Promise<PackageJson> {
  const packageJsonPath = join(process.cwd(), pathFromPackageRoot);
  const packageJsonContent = await readFile(packageJsonPath, "utf8");

  return JSON.parse(packageJsonContent) as PackageJson;
}

describe("tooling scripts", () => {
  it("normalizes generated eslint docs with Prettier", async () => {
    const packageJson = await readPackageJson();
    const updateDocsScript = packageJson.scripts?.["update:eslint-docs"];

    expect(updateDocsScript).toContain("eslint-doc-generator");
    expect(updateDocsScript).toContain("--config-emoji all,🌐");
    expect(updateDocsScript).toContain("--config-emoji best-practices,🏆");
    expect(updateDocsScript).toContain("--config-emoji complexity,🧮");
    expect(updateDocsScript).toContain("--config-emoji hygiene,🧹");
    expect(updateDocsScript).toContain("--config-emoji recommended,✅");
    expect(updateDocsScript).toContain("--config-emoji style,🎨");
    expect(updateDocsScript).toContain("--config-emoji typescript,⌨️");
    expect(updateDocsScript).toContain("--ignore-config bestPractices");
    expect(updateDocsScript).toContain("prettier --write");
    expect(updateDocsScript).toContain("README.md");
    expect(updateDocsScript).toContain("docs/rules/**/*.md");
  });

  it("runs build and test gates across the MCP workspace", async () => {
    const packageJson = await readPackageJson("../../package.json");

    expect(packageJson.private).toBe(true);
    expect(packageJson.scripts?.build).toContain(
      "npm --workspace eslint-plugin-llm-core run build",
    );
    expect(packageJson.scripts?.build).toContain(
      "npm --workspace eslint-plugin-llm-core-mcp run build",
    );
    expect(packageJson.scripts?.test).toContain(
      "npm --workspace eslint-plugin-llm-core test",
    );
    expect(packageJson.scripts?.test).toContain(
      "npm --workspace eslint-plugin-llm-core-mcp test",
    );
    expect(packageJson.scripts?.["test:coverage"]).toContain(
      "npm --workspace eslint-plugin-llm-core-mcp test",
    );
  });
});
