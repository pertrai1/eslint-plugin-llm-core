import { describe, it, expect, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

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
});
