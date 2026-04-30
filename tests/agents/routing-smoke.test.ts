import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../..");

const readRepoFile = (relativePath: string): string =>
  readFileSync(path.join(repoRoot, relativePath), "utf8");

const directivePaths = [
  ".agents/directives/adaptive-routing.md",
  ".agents/directives/architecture-boundaries.md",
  ".agents/directives/codebase-navigation.md",
  ".agents/directives/context-handoff.md",
  ".agents/directives/error-memory.md",
  ".agents/directives/exploration-mode.md",
  ".agents/directives/session-decisions.md",
  ".agents/directives/specification-driven-development.md",
  ".agents/directives/task-framing.md",
  ".agents/directives/test-driven-development.md",
  ".agents/directives/type-driven-development.md",
  ".agents/directives/verification.md",
] as const;

const skillPaths = [
  ".agents/skills/architecture-boundary-reviewer/SKILL.md",
  ".agents/skills/codebase-health-reviewer/SKILL.md",
  ".agents/skills/self-audit/SKILL.md",
  ".agents/skills/spec-reviewer/SKILL.md",
  ".agents/skills/systematic-debugging/SKILL.md",
  ".agents/skills/test-reviewer/SKILL.md",
] as const;

const routeScenarios = [
  {
    name: "docs-only edits stay on Light Path without loading every directive",
    requiredText: [
      "### Light Path",
      "docs wording edits",
      "Do **not** use Light Path for bug fixes",
    ],
    expectedPaths: [],
  },
  {
    name: "behavior changes route to Full Path and TDD/verification guidance",
    requiredText: ["### Full Path", "behavior changes", "Required directives:"],
    expectedPaths: [
      ".agents/directives/codebase-navigation.md",
      ".agents/directives/test-driven-development.md",
      ".agents/directives/verification.md",
      ".agents/skills/test-reviewer/SKILL.md",
      ".agents/skills/self-audit/SKILL.md",
    ],
  },
  {
    name: "failing build/test/CI routes to Debugging Path and systematic debugging",
    requiredText: [
      "### Debugging Path",
      "failing tests",
      "failing CI/build/lint/type-check",
    ],
    expectedPaths: [
      ".agents/skills/systematic-debugging/SKILL.md",
      ".agents/directives/verification.md",
    ],
  },
  {
    name: "imports, exports, and public API changes add Boundary Path",
    requiredText: [
      "### Boundary Path",
      "imports or exports",
      "public entry points",
    ],
    expectedPaths: [
      ".agents/directives/architecture-boundaries.md",
      ".agents/skills/architecture-boundary-reviewer/SKILL.md",
    ],
  },
  {
    name: "PR/diff review routes to Review Path and specialized reviewers",
    requiredText: [
      "### Review Path",
      "review a PR, branch, diff, or local changes",
    ],
    expectedPaths: [
      ".agents/skills/test-reviewer/SKILL.md",
      ".agents/skills/spec-reviewer/SKILL.md",
      ".agents/skills/codebase-health-reviewer/SKILL.md",
    ],
  },
] as const;

describe("agent directive routing smoke test", () => {
  it("keeps directive filenames lowercase and aligned with referenced paths", () => {
    for (const directivePath of directivePaths) {
      expect(
        existsSync(path.join(repoRoot, directivePath)),
        directivePath,
      ).toBe(true);
    }

    const directiveFiles = readdirSync(
      path.join(repoRoot, ".agents/directives"),
    );
    expect(directiveFiles).toEqual([...directiveFiles].sort());
    expect(directiveFiles.every((file) => file === file.toLowerCase())).toBe(
      true,
    );
    expect(
      directiveFiles.every(
        (file) => file.includes("-") || file === "verification.md",
      ),
    ).toBe(true);
  });

  it("asks agents to disclose the active route and loaded guidance", () => {
    const agents = readRepoFile("AGENTS.md");
    const adaptiveRouting = readRepoFile(
      ".agents/directives/adaptive-routing.md",
    );

    expect(agents).toContain(
      "briefly state the selected path and directive/skill",
    );
    expect(adaptiveRouting).toContain(
      "display the active workflow path and directive/skill files",
    );
    expect(adaptiveRouting).toContain(
      "- Path: <Light | Full | Debugging | Boundary | Review | Exploration | Policy>",
    );
    expect(adaptiveRouting).toContain("- Required directives: <paths>");
    expect(adaptiveRouting).toContain("- Required skills: <paths, if any>");
  });

  it("routes representative task types to the expected directives and skills", () => {
    const adaptiveRouting = readRepoFile(
      ".agents/directives/adaptive-routing.md",
    );

    for (const scenario of routeScenarios) {
      for (const text of scenario.requiredText) {
        expect(adaptiveRouting, `${scenario.name}: ${text}`).toContain(text);
      }

      for (const expectedPath of scenario.expectedPaths) {
        expect(adaptiveRouting, `${scenario.name}: ${expectedPath}`).toContain(
          expectedPath,
        );
        expect(
          existsSync(path.join(repoRoot, expectedPath)),
          expectedPath,
        ).toBe(true);
      }
    }
  });

  it("does not contain stale uppercase or malformed directive/skill paths", () => {
    const instructionFiles = ["AGENTS.md", ...directivePaths, ...skillPaths];

    for (const filePath of instructionFiles) {
      const text = readRepoFile(filePath);
      expect(text, filePath).not.toMatch(/\.agents\/directives\/[A-Z_]+\.md/);
      expect(text, filePath).not.toContain(".agents/.agents/skills/");
    }
  });
});
