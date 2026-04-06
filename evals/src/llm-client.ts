import Anthropic from "@anthropic-ai/sdk";
import type { LintViolation } from "./types";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

function requireApiKey(): string {
  const key = process.env["ANTHROPIC_API_KEY"];
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set. Export it before running evals.",
    );
  }
  return key;
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

export async function fixViolations(
  code: string,
  violations: LintViolation[],
  model: string = DEFAULT_MODEL,
): Promise<string> {
  const client = new Anthropic({ apiKey: requireApiKey() });
  const userMessage = buildFixViolationsPrompt(code, violations);

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system:
      "You are a TypeScript developer fixing ESLint violations. Return ONLY the fixed TypeScript code, no explanations, no markdown fences.",
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("LLM returned no text content");
  }

  return extractCode(textBlock.text);
}
