import type {
  GenerateInstructionsOptions,
  GenerateInstructionsResult,
} from "./instructions/types";
import { resolveActiveRules } from "./instructions/config-resolver";
import { generateMarkdown } from "./instructions/generator";

export async function generateInstructions(
  options?: GenerateInstructionsOptions,
): Promise<GenerateInstructionsResult> {
  const activeRules = await resolveActiveRules(options?.configPath);
  const content = generateMarkdown(activeRules);
  const allFilesRules = activeRules.filter((rule) => rule.scope === "all");
  const typescriptRules = activeRules.filter(
    (rule) => rule.scope === "typescript-only",
  );

  return { content, activeRules, allFilesRules, typescriptRules };
}
