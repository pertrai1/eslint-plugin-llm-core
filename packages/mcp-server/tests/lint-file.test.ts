import { describe, it, expect, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { fileURLToPath } from "node:url";
import { makeTestServer } from "./helpers/make-test-server.js";

/**
 * Integration tests for the lint_file tool (sub-task 3.1 RED → sub-task 3.2 GREEN).
 * Drives the tool over an in-memory transport per Assumption A2.
 *
 * Fixture: tests/fixtures/project-with-config/
 *   eslint.config.js  — flat config enabling llm-core/no-empty-catch
 *   src/bad.ts        — violates no-empty-catch
 */

interface LintViolation {
  ruleId: string;
  line: number;
  column: number;
  severity: number;
  message: string;
  instruction: string | undefined;
}

const BAD_FILE = fileURLToPath(
  new URL("./fixtures/project-with-config/src/bad.ts", import.meta.url),
);

describe("lint_file tool", () => {
  const clients: Client[] = [];

  afterEach(async () => {
    await Promise.all(clients.map((c) => c.close().catch(() => {})));
    clients.length = 0;
  });

  it("returns a violation for no-empty-catch with instruction attached", async () => {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    clients.push(client);

    const server = await makeTestServer();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: "lint_file",
      arguments: { path: BAD_FILE },
    });

    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { type: string; text: string }).text;
    const violations = JSON.parse(text) as LintViolation[];

    expect(Array.isArray(violations)).toBe(true);
    expect(violations.length).toBeGreaterThan(0);

    const violation = violations.find(
      (v) => v.ruleId === "llm-core/no-empty-catch",
    );
    expect(violation).toBeDefined();
    expect(violation?.line).toBeGreaterThan(0);
    expect(violation?.column).toBeGreaterThan(0);
    expect(violation?.severity).toBeGreaterThan(0);
    expect(typeof violation?.message).toBe("string");
    // Instruction must be attached and contain the rule's guidance.
    expect(violation?.instruction).toBeDefined();
    expect(violation?.instruction).toContain("Never leave catch blocks empty");
  });

  it("excludes non-llm-core violations from results", async () => {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    clients.push(client);

    const server = await makeTestServer();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: "lint_file",
      arguments: { path: BAD_FILE },
    });

    const text = (result.content[0] as { type: string; text: string }).text;
    const violations = JSON.parse(text) as LintViolation[];

    // Every returned violation must be an llm-core/ rule.
    for (const v of violations) {
      expect(v.ruleId).toMatch(/^llm-core\//);
    }
  });
});
