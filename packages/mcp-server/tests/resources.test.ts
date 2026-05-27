import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { makeTestServer } from "./helpers/make-test-server.js";

interface RuleListEntry {
  name: string;
  description: string;
  hasInstruction: boolean;
  category: string;
}

interface RuleListPayload {
  total: number;
  categories: Record<string, number>;
  rules: RuleListEntry[];
}

const clients: Client[] = [];

afterEach(async () => {
  await Promise.all(clients.map((client) => client.close().catch(() => {})));
  clients.length = 0;
});

async function connectClient(): Promise<Client> {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  clients.push(client);

  const server = await makeTestServer();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

function readTextResource(result: {
  contents: Array<{ text?: string }>;
}): string {
  const text = result.contents[0]?.text;
  expect(text).toBeDefined();
  return text as string;
}

describe("rule resources", () => {
  it("lists every rule with category and instruction metadata", async () => {
    const client = await connectClient();

    const listed = await client.listResources();
    expect(listed.resources.some((r) => r.uri === "llm-core://rules")).toBe(
      true,
    );

    const result = await client.readResource({ uri: "llm-core://rules" });
    const payload = JSON.parse(readTextResource(result)) as RuleListPayload;
    const noEmptyCatch = payload.rules.find(
      (rule) => rule.name === "no-empty-catch",
    );

    expect(payload.total).toBe(32);
    expect(payload.categories).toEqual({
      complexity: 5,
      typescript: 4,
      "best-practices": 12,
      style: 7,
      hygiene: 4,
    });
    expect(noEmptyCatch).toEqual({
      name: "no-empty-catch",
      description:
        "Disallow catch blocks with no meaningful error handling (empty or comment-only blocks)",
      hasInstruction: true,
      category: "best-practices",
    });
  });

  it("exposes a rule documentation template that enumerates rule names", async () => {
    const client = await connectClient();

    const { resourceTemplates } = await client.listResourceTemplates();
    const template = resourceTemplates.find(
      (resourceTemplate) =>
        resourceTemplate.uriTemplate === "llm-core://rules/{ruleName}",
    );
    const listed = await client.listResources();

    expect(template).toBeDefined();
    expect(
      listed.resources.some((r) => r.uri === "llm-core://rules/no-empty-catch"),
    ).toBe(true);
  });

  it("returns embedded markdown documentation for a known rule", async () => {
    const client = await connectClient();

    const result = await client.readResource({
      uri: "llm-core://rules/no-empty-catch",
    });
    const text = readTextResource(result);

    expect(text).toContain("# llm-core/no-empty-catch");
    expect(text).toContain("llm-core/no-empty-catch");
  });

  it("returns an informative error for an unknown rule", async () => {
    const client = await connectClient();

    await expect(
      client.readResource({ uri: "llm-core://rules/not-a-rule" }),
    ).rejects.toThrow(/Unknown llm-core rule "not-a-rule".*no-empty-catch/s);
  });
});
