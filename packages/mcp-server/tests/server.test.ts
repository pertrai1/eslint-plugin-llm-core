import { describe, it, expect, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDirectRun } from "../src/server.js";
import { makeTestServer } from "./helpers/make-test-server.js";

/**
 * Integration test: verifies that the MCP server scaffolding accepts a client
 * connection via in-memory transport (sub-task 2.4).
 *
 * Uses InMemoryTransport.createLinkedPair() to wire client ↔ server in-process
 * with no spawned process (per Assumption A2).
 *
 * Note: McpServer only registers tools/list once tools are added, so tool/
 * resource enumeration tests belong in Tasks 3–5 after registration.
 */

function makeServer(): McpServer {
  return new McpServer({ name: "test-server", version: "0.0.0" });
}

describe("MCP server scaffold", () => {
  const clients: Client[] = [];

  afterEach(async () => {
    await Promise.all(clients.map((c) => c.close().catch(() => {})));
    clients.length = 0;
  });

  it("accepts an initialize request from a client over in-memory transport", async () => {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    const server = makeServer();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    clients.push(client);

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    // A successful connect() means the initialize handshake completed.
    const serverInfo = client.getServerVersion();
    expect(serverInfo).toBeDefined();
    expect(serverInfo?.name).toBe("test-server");
    expect(serverInfo?.version).toBe("0.0.0");
  });

  it("enumerates the assembled server tools and resources", async () => {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const server = await makeTestServer();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    clients.push(client);

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const [{ tools }, { resources }, { resourceTemplates }] = await Promise.all(
      [
        client.listTools(),
        client.listResources(),
        client.listResourceTemplates(),
      ],
    );

    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "get_active_instructions",
      "lint_file",
    ]);
    expect(
      resources.some((resource) => resource.uri === "llm-core://rules"),
    ).toBe(true);
    expect(
      resourceTemplates.some(
        (template) => template.uriTemplate === "llm-core://rules/{ruleName}",
      ),
    ).toBe(true);
  });
});

describe("server entrypoint detection", () => {
  it("treats bin symlinks to the server file as direct execution", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "llmcore-mcp-bin-"));

    try {
      const realServer = path.join(dir, "server.js");
      const binLink = path.join(dir, "llm-core-mcp");
      await writeFile(realServer, "#!/usr/bin/env node\n");
      await symlink(realServer, binLink);

      expect(isDirectRun(binLink, pathToFileURL(realServer).href)).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("does not start the server when imported by another module", () => {
    expect(
      isDirectRun("/tmp/importer.js", pathToFileURL("/tmp/server.js").href),
    ).toBe(false);
  });
});
