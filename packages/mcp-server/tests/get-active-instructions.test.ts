import { describe, it, expect, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { makeTestServer } from "./helpers/make-test-server.js";

/**
 * Integration tests for the get_active_instructions tool (sub-task 4.1).
 * Drives the tool over an in-memory transport per Assumption A2.
 */

describe("get_active_instructions tool", () => {
  const clients: Client[] = [];

  afterEach(async () => {
    await Promise.all(clients.map((c) => c.close().catch(() => {})));
    clients.length = 0;
  });

  it("returns non-empty markdown content", async () => {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    clients.push(client);

    const server = await makeTestServer();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: "get_active_instructions",
      arguments: {},
    });

    expect(result.content).toHaveLength(1);
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
  });

  it("response includes rule scope counts in the text", async () => {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    clients.push(client);

    const server = await makeTestServer();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: "get_active_instructions",
      arguments: {},
    });

    const text = (result.content[0] as { type: string; text: string }).text;
    // Response must include scope count metadata
    expect(text).toMatch(
      /allFilesRules|javascriptRules|typescriptRules|rules/i,
    );
  });

  it("response includes rule scope counts as metadata", async () => {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    clients.push(client);

    const server = await makeTestServer();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: "get_active_instructions",
      arguments: {},
    });

    expect(result._meta?.scopeCounts).toEqual({
      allFilesRules: expect.any(Number),
      javascriptRules: expect.any(Number),
      typescriptRules: expect.any(Number),
    });
  });
});
