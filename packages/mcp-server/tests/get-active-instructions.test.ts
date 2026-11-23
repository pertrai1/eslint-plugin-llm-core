import { describe, it, expect, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { registerGetActiveInstructions } from "../src/tools/get-active-instructions.js";

const FIXTURE_ROOT = fileURLToPath(
  new URL("./fixtures/project-with-config/", import.meta.url),
);

describe("get_active_instructions tool", () => {
  const clients: Client[] = [];

  afterEach(async () => {
    await Promise.all(clients.map((client) => client.close()));
    clients.length = 0;
  });

  async function connect(projectRoot?: string): Promise<Client> {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    clients.push(client);
    const server = new McpServer({ name: "test-server", version: "0.0.0" });
    registerGetActiveInstructions(server, projectRoot);
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    return client;
  }

  it("preserves the no-path markdown and scope counts but labels its overview approximate", async () => {
    const client = await connect();
    const result = await client.callTool({
      name: "get_active_instructions",
      arguments: {},
    });

    expect(result.isError).not.toBe(true);
    expect(result.content).toEqual([
      {
        type: "text",
        text: expect.stringMatching(
          /# Coding Guidelines[\s\S]*approximate[\s\S]*scope counts:/i,
        ),
      },
    ]);
    expect(result._meta?.scopeCounts).toEqual({
      allFilesRules: expect.any(Number),
      javascriptRules: expect.any(Number),
      typescriptRules: expect.any(Number),
    });
  });

  it("still accepts an explicit configPath for the approximate overview", async () => {
    const client = await connect();
    const result = await client.callTool({
      name: "get_active_instructions",
      arguments: { configPath: join(FIXTURE_ROOT, "eslint.config.js") },
    });

    expect(result.isError).not.toBe(true);
    expect(result.content).toEqual([
      { type: "text", text: expect.stringContaining("Approximate overview") },
    ]);
    expect(result._meta?.scopeCounts).toEqual({
      allFilesRules: 0,
      javascriptRules: 0,
      typescriptRules: 0,
    });
  });

  it.each([
    ["configurable/default/fn.ts", 2, 5],
    ["configurable/explicit/fn.ts", 1, 1],
  ])(
    "reports only the effective instructions for %s",
    async (path, max, constructors) => {
      const client = await connect(FIXTURE_ROOT);
      const result = await client.callTool({
        name: "get_active_instructions",
        arguments: { path },
      });

      expect(result.isError).not.toBe(true);
      expect(result.content).toEqual([
        {
          type: "text",
          text: `# Active lint instructions for \`${path}\`\n\n- Limit function parameters to ${max} (constructors: ${constructors}) — use object parameter patterns`,
        },
      ]);
    },
  );

  it("reports when an existing file has no llm-core rules enabled", async () => {
    const client = await connect(FIXTURE_ROOT);
    const result = await client.callTool({
      name: "get_active_instructions",
      arguments: { path: "precedence/empty-catch.ts" },
    });

    expect(result.isError).not.toBe(true);
    expect(result.content).toEqual([
      {
        type: "text",
        text: expect.stringContaining("No llm-core rules are enabled"),
      },
    ]);
  });

  it.each([
    [{ path: "configurable" }, "existing file"],
    [{ path: "not-here.ts" }, "existing file"],
    [{ path: "src/bad.ts", configPath: "eslint.config.js" }, "not both"],
  ])(
    "explains an invalid file-specific request: %j",
    async (args, explanation) => {
      const client = await connect(FIXTURE_ROOT);
      const result = await client.callTool({
        name: "get_active_instructions",
        arguments: args,
      });

      expect(result.isError).toBe(true);
      expect(result.content).toEqual([
        { type: "text", text: expect.stringContaining(explanation) },
      ]);
    },
  );
});
