import { describe, it, expect, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { mkdtemp, readdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  makeTestServer,
  type MakeTestServerOptions,
} from "./helpers/make-test-server.js";

/**
 * Integration tests for the lint_file tool (Task 3).
 * Drives the tool over an in-memory transport per Assumption A2.
 *
 * Fixture: tests/fixtures/project-with-config/
 *   eslint.config.js  — flat config: llm-core/no-empty-catch + core no-debugger
 *   src/bad.ts        — violates no-empty-catch and no-debugger
 */

interface LintViolation {
  ruleId: string;
  line: number;
  column: number;
  severity: number;
  message: string;
  instruction: string | undefined;
  source: "project-config" | "fallback";
}

interface LintToolResult {
  content: Array<{ type: string; text: string }>;
  structuredContent?: {
    source?: unknown;
    violationCount?: unknown;
    violations?: unknown[];
  };
}

const PROJECT_WITH_CONFIG = fileURLToPath(
  new URL("./fixtures/project-with-config/", import.meta.url),
);
const BAD_FILE = fileURLToPath(
  new URL("./fixtures/project-with-config/src/bad.ts", import.meta.url),
);
const CONFIGURABLE_DEFAULT_FILE = fileURLToPath(
  new URL(
    "./fixtures/project-with-config/configurable/default/fn.ts",
    import.meta.url,
  ),
);
const CONFIGURABLE_EXPLICIT_FILE = fileURLToPath(
  new URL(
    "./fixtures/project-with-config/configurable/explicit/fn.ts",
    import.meta.url,
  ),
);
const SRC_DIR = fileURLToPath(
  new URL("./fixtures/project-with-config/src", import.meta.url),
);
const PRECEDENCE_FILE = fileURLToPath(
  new URL(
    "./fixtures/project-with-config/precedence/empty-catch.ts",
    import.meta.url,
  ),
);

const clients: Client[] = [];

afterEach(async () => {
  await Promise.all(clients.map((c) => c.close().catch(() => {})));
  clients.length = 0;
});

async function connectClient(options?: MakeTestServerOptions): Promise<Client> {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  clients.push(client);

  const server = await makeTestServer(options);
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

function readViolations(result: LintToolResult): LintViolation[] {
  const text = result.content[0].text;
  return JSON.parse(text) as LintViolation[];
}

describe("lint_file tool", () => {
  it("returns a violation for no-empty-catch with instruction attached", async () => {
    const client = await connectClient({ projectRoot: PROJECT_WITH_CONFIG });

    const result = await client.callTool({
      name: "lint_file",
      arguments: { path: BAD_FILE },
    });

    expect(result.isError).toBeFalsy();
    const violations = readViolations(result as LintToolResult);

    expect(Array.isArray(violations)).toBe(true);
    const violation = violations.find(
      (v) => v.ruleId === "llm-core/no-empty-catch",
    );
    expect(violation).toBeDefined();
    expect(violation?.line).toBeGreaterThan(0);
    expect(violation?.column).toBeGreaterThan(0);
    expect(violation?.severity).toBe(2);
    expect(typeof violation?.message).toBe("string");
    expect(violation?.message.length).toBeGreaterThan(0);
    expect(violation?.source).toBe("project-config");
    expect((result as LintToolResult).structuredContent).toMatchObject({
      source: "project-config",
      violationCount: violations.length,
    });
    // Instruction must be attached and carry the rule's guidance verbatim.
    expect(violation?.instruction).toBe(
      "Never leave catch blocks empty — handle, rethrow, or log the error",
    );
  });

  it("excludes non-llm-core diagnostics (e.g. no-debugger) from results", async () => {
    const client = await connectClient({ projectRoot: PROJECT_WITH_CONFIG });

    const result = await client.callTool({
      name: "lint_file",
      arguments: { path: BAD_FILE },
    });

    const violations = readViolations(
      result as { content: Array<{ type: string; text: string }> },
    );

    // The fixture also trips core no-debugger; it must not appear in results,
    // and every returned violation must be an llm-core/ rule.
    expect(violations.some((v) => v.ruleId === "no-debugger")).toBe(false);
    expect(violations.length).toBeGreaterThan(0);
    for (const v of violations) {
      expect(v.ruleId.startsWith("llm-core/")).toBe(true);
    }
  });
});

describe("lint_file option-template interpolation", () => {
  function findInstruction(
    violations: LintViolation[],
    ruleId: string,
  ): string | undefined {
    return violations.find((v) => v.ruleId === ruleId)?.instruction;
  }

  it("interpolates explicit option values into the optionTemplate", async () => {
    const client = await connectClient({ projectRoot: PROJECT_WITH_CONFIG });

    const result = await client.callTool({
      name: "lint_file",
      arguments: { path: CONFIGURABLE_EXPLICIT_FILE },
    });

    const violations = readViolations(
      result as { content: Array<{ type: string; text: string }> },
    );
    const instruction = findInstruction(violations, "llm-core/max-params");

    // max-params optionTemplate interpolated with the configured { max: 1,
    // maxConstructor: 1 }; no literal {placeholder} tokens may remain.
    expect(instruction).toBe(
      "Limit function parameters to 1 (constructors: 1) — use object parameter patterns",
    );
    expect(instruction).not.toMatch(/\{[a-zA-Z]+\}/);
  });

  it("interpolates the rule's default options when none are configured", async () => {
    const client = await connectClient({ projectRoot: PROJECT_WITH_CONFIG });

    const result = await client.callTool({
      name: "lint_file",
      arguments: { path: CONFIGURABLE_DEFAULT_FILE },
    });

    const violations = readViolations(
      result as { content: Array<{ type: string; text: string }> },
    );
    const instruction = findInstruction(violations, "llm-core/max-params");

    // No options configured: defaults { max: 2, maxConstructor: 5 } must be
    // merged in and interpolated, with no {placeholder} leaks.
    expect(instruction).toBe(
      "Limit function parameters to 2 (constructors: 5) — use object parameter patterns",
    );
    expect(instruction).not.toMatch(/\{[a-zA-Z]+\}/);
  });
});

describe("lint_file with no discoverable ESLint config", () => {
  it("returns an actionable install/configure message, not an empty array", async () => {
    // A temp dir outside the repo so ESLint's upward search finds no config.
    const dir = await mkdtemp(path.join(tmpdir(), "llmcore-mcp-noconfig-"));
    try {
      const target = path.join(dir, "foo.ts");
      await writeFile(target, "export const x = 1;\n");

      const client = await connectClient({ projectRoot: dir });
      const result = (await client.callTool({
        name: "lint_file",
        arguments: { path: target },
      })) as {
        isError?: boolean;
        content: Array<{ type: string; text: string }>;
      };

      const text = result.content[0].text;
      // Must be an actionable message, not a JSON violations array.
      expect(() => JSON.parse(text)).toThrow();
      expect(text).toContain("eslint-plugin-llm-core");
      expect(text.toLowerCase()).toMatch(/install/);
      expect(text.toLowerCase()).toMatch(/configure|config/);
      // Informational guidance, not a thrown protocol error.
      expect(result.isError).toBeFalsy();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("runs fallback linting when fallback mode is enabled", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "llmcore-mcp-fallback-"));
    try {
      const target = path.join(dir, "foo.ts");
      await writeFile(
        target,
        [
          "try {",
          '  throw new Error("boom");',
          "} catch (error) {",
          "}",
          "",
        ].join("\n"),
      );

      const client = await connectClient({
        projectRoot: dir,
        fallbackEnabled: true,
      });
      const result = (await client.callTool({
        name: "lint_file",
        arguments: { path: target },
      })) as LintToolResult;

      const violations = readViolations(result);
      const violation = violations.find(
        (v) => v.ruleId === "llm-core/no-empty-catch",
      );

      expect(violation).toEqual(
        expect.objectContaining({
          ruleId: "llm-core/no-empty-catch",
          source: "fallback",
          instruction:
            "Never leave catch blocks empty — handle, rethrow, or log the error",
        }),
      );
      expect(result.structuredContent).toMatchObject({
        source: "fallback",
        violationCount: violations.length,
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("uses the project config instead of fallback when both are available", async () => {
    const client = await connectClient({
      projectRoot: PROJECT_WITH_CONFIG,
      fallbackEnabled: true,
    });

    const result = (await client.callTool({
      name: "lint_file",
      arguments: { path: PRECEDENCE_FILE },
    })) as LintToolResult;

    expect(readViolations(result)).toEqual([]);
    expect(result.structuredContent).toMatchObject({
      source: "project-config",
      violationCount: 0,
    });
  });

  it("parses TypeScript syntax in fallback mode", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "llmcore-mcp-ts-"));
    try {
      const target = path.join(dir, "types.ts");
      await writeFile(target, "const values: Array<any> = [];\n");

      const client = await connectClient({
        projectRoot: dir,
        fallbackEnabled: true,
      });
      const result = (await client.callTool({
        name: "lint_file",
        arguments: { path: target },
      })) as LintToolResult;

      expect(readViolations(result)).toEqual([
        expect.objectContaining({
          ruleId: "llm-core/no-any-in-generic",
          source: "fallback",
        }),
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("parses JSX syntax in fallback mode without parser errors", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "llmcore-mcp-jsx-"));
    try {
      const target = path.join(dir, "component.jsx");
      await writeFile(
        target,
        [
          "function Greeting({ name }: { name: string }) {",
          "  return <div>Hello, {name}!</div>;",
          "}",
          "",
        ].join("\n"),
      );

      const client = await connectClient({
        projectRoot: dir,
        fallbackEnabled: true,
      });
      const result = (await client.callTool({
        name: "lint_file",
        arguments: { path: target },
      })) as LintToolResult;

      const violations = readViolations(result);
      // JSX must parse without fatal errors; violations are valid llm-core rules
      for (const v of violations) {
        expect(v.ruleId.startsWith("llm-core/")).toBe(true);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("does not create config or cache files when fallback mode runs", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "llmcore-mcp-readonly-"));
    try {
      const target = path.join(dir, "foo.ts");
      await writeFile(target, "try {} catch (error) {}\n");

      const client = await connectClient({
        projectRoot: dir,
        fallbackEnabled: true,
      });
      const before = await readdir(dir);
      const result = (await client.callTool({
        name: "lint_file",
        arguments: { path: target },
      })) as LintToolResult;
      const after = await readdir(dir);

      expect(before).toEqual(["foo.ts"]);
      expect(readViolations(result)).toEqual([
        expect.objectContaining({ source: "fallback" }),
      ]);
      expect(after).toEqual(["foo.ts"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("lint_file path sandboxing", () => {
  async function callWithPath(targetPath: string) {
    const client = await connectClient({ projectRoot: PROJECT_WITH_CONFIG });
    return (await client.callTool({
      name: "lint_file",
      arguments: { path: targetPath },
    })) as {
      isError?: boolean;
      content: Array<{ type: string; text: string }>;
    };
  }

  it("rejects a relative path that escapes the project root", async () => {
    const result = await callWithPath("../../../../package.json");

    expect(result.isError).toBe(true);
    expect(result.content[0].text.toLowerCase()).toContain("project root");
  });

  it("rejects an absolute path outside the project root", async () => {
    const result = await callWithPath("/etc/hosts");

    expect(result.isError).toBe(true);
    expect(result.content[0].text.toLowerCase()).toContain("project root");
  });

  it("rejects an absolute path outside the project root before fallback can run", async () => {
    const client = await connectClient({
      projectRoot: PROJECT_WITH_CONFIG,
      fallbackEnabled: true,
    });
    const result = (await client.callTool({
      name: "lint_file",
      arguments: { path: "/etc/hosts" },
    })) as {
      isError?: boolean;
      content: Array<{ type: string; text: string }>;
    };

    expect(result.isError).toBe(true);
    expect(result.content[0].text.toLowerCase()).toContain("project root");
  });

  it("rejects a symlink inside the project root that resolves outside it", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "llmcore-mcp-root-"));
    const outsideRoot = await mkdtemp(
      path.join(tmpdir(), "llmcore-mcp-outside-"),
    );

    try {
      const outsideFile = path.join(outsideRoot, "outside.ts");
      const linkPath = path.join(projectRoot, "outside-link.ts");
      await writeFile(outsideFile, "export const outside = true;\n");
      await symlink(outsideFile, linkPath);

      const client = await connectClient({ projectRoot });
      const result = (await client.callTool({
        name: "lint_file",
        arguments: { path: "outside-link.ts" },
      })) as {
        isError?: boolean;
        content: Array<{ type: string; text: string }>;
      };

      expect(result.isError).toBe(true);
      expect(result.content[0].text.toLowerCase()).toContain("project root");
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
      await rm(outsideRoot, { recursive: true, force: true });
    }
  });
});

describe("lint_file directory file-count guard", () => {
  it("lints a directory that is within the file cap", async () => {
    const client = await connectClient({ projectRoot: PROJECT_WITH_CONFIG });

    const result = await client.callTool({
      name: "lint_file",
      arguments: { path: SRC_DIR },
    });

    const violations = readViolations(
      result as { content: Array<{ type: string; text: string }> },
    );
    // src/ is well under the default cap, so it lints normally.
    expect(violations.some((v) => v.ruleId === "llm-core/no-empty-catch")).toBe(
      true,
    );
  });

  it("warns instead of linting when a directory exceeds the configurable cap", async () => {
    const client = await connectClient({
      projectRoot: PROJECT_WITH_CONFIG,
      maxFiles: 1,
    });

    const result = (await client.callTool({
      name: "lint_file",
      arguments: { path: PROJECT_WITH_CONFIG },
    })) as {
      isError?: boolean;
      content: Array<{ type: string; text: string }>;
    };

    const text = result.content[0].text;
    // A warning string, not a JSON violations array.
    expect(() => JSON.parse(text)).toThrow();
    expect(text.toLowerCase()).toContain("narrow");
    expect(text).toContain("1");
    expect(result.isError).toBeFalsy();
  });
});

describe("lint_file registration", () => {
  it("is exposed as a tool with a required string `path` input", async () => {
    const client = await connectClient({ projectRoot: PROJECT_WITH_CONFIG });

    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === "lint_file");

    expect(tool).toBeDefined();
    const schema = tool?.inputSchema as {
      properties?: Record<string, { type?: string }>;
      required?: string[];
    };
    expect(schema?.properties?.path?.type).toBe("string");
    expect(schema?.required).toContain("path");
  });
});
