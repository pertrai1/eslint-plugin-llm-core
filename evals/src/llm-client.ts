import Anthropic from "@anthropic-ai/sdk";
import type { LintViolation, LlmFixResult } from "./types";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export const SYSTEM_PROMPT = [
  "You are a TypeScript developer fixing ESLint violations.",
  "",
  "First, briefly explain your reasoning inside <reasoning> tags.",
  "Then return the complete fixed TypeScript code (no markdown fences).",
  "",
  "Example response format:",
  "<reasoning>",
  "The function needs an explicit return type annotation.",
  "</reasoning>",
  "export function example(): string { return 'hello'; }",
].join("\n");

export function requireApiKey(): string {
  const key = process.env["ANTHROPIC_API_KEY"];
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set. Export it before running evals.",
    );
  }
  return key;
}

export function extractReasoning(response: string): string | null {
  const match = /<reasoning>([\s\S]*?)<\/reasoning>/.exec(response);
  if (!match) return null;
  return (match[1] ?? "").trim();
}

function extractCode(response: string): string {
  const fenceMatch =
    /```(?:typescript|ts|javascript|js)?\n([\s\S]*?)\n```/.exec(response);
  if (fenceMatch) {
    return fenceMatch[1] ?? response;
  }
  return response.trim();
}

export function formatViolationList(violations: LintViolation[]): string {
  return violations
    .map(
      (v, i) =>
        `${i + 1}. Line ${v.line}, Col ${v.column}:\n   ${v.message.replace(/\n/g, "\n   ")}`,
    )
    .join("\n\n");
}

export function buildFixViolationsPrompt(
  code: string,
  violations: LintViolation[],
): string {
  return [
    "Fix the following ESLint violations in this TypeScript code:",
    "",
    "## Code",
    "```typescript",
    code,
    "```",
    "",
    "## Violations to fix",
    formatViolationList(violations),
  ].join("\n");
}

function stripReasoningTags(response: string): string {
  const closeTag = "</reasoning>";
  const closeIndex = response.indexOf(closeTag);

  if (closeIndex !== -1) {
    return response.slice(closeIndex + closeTag.length).trim();
  }

  return response.trim();
}

export async function fixViolations(
  code: string,
  violations: LintViolation[],
  model: string = DEFAULT_MODEL,
): Promise<LlmFixResult> {
  const client = new Anthropic({ apiKey: requireApiKey() });
  const prompt = buildFixViolationsPrompt(code, violations);

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlocks = response.content.filter(
    (
      block,
    ): block is Extract<(typeof response.content)[number], { type: "text" }> =>
      block.type === "text",
  );
  if (textBlocks.length === 0) {
    throw new Error("LLM returned no text content");
  }

  const rawResponse = textBlocks.map((b) => b.text).join("\n");

  return {
    code: extractCode(stripReasoningTags(rawResponse)),
    rawResponse,
    reasoning: extractReasoning(rawResponse),
    tokenUsage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    prompt,
  };
}
