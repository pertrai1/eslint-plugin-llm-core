import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface PackageJson {
  scripts?: Record<string, string>;
}

async function readPackageJson(): Promise<PackageJson> {
  const packageJsonPath = join(process.cwd(), "package.json");
  const packageJsonContent = await readFile(packageJsonPath, "utf8");

  return JSON.parse(packageJsonContent) as PackageJson;
}

describe("tooling scripts", () => {
  it("normalizes generated eslint docs with Prettier", async () => {
    const packageJson = await readPackageJson();
    const updateDocsScript = packageJson.scripts?.["update:eslint-docs"];

    expect(updateDocsScript).toContain("eslint-doc-generator");
    expect(updateDocsScript).toContain("prettier --write");
    expect(updateDocsScript).toContain("README.md");
    expect(updateDocsScript).toContain("docs/rules/**/*.md");
  });
});
