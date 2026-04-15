import path from "path";
import fs from "fs";

export const instructionFilePaths = [
  "AGENTS.md",
  "CLAUDE.md",
  ".github/copilot-instructions.md",
] as const;

export type InstructionFilePath = (typeof instructionFilePaths)[number];

export const injectionBlockStart = "<!-- llm-core-instructions:start -->";
export const injectionBlockEnd = "<!-- llm-core-instructions:end -->";

export const lintingRulesPath = path.join(".agents", "linting-rules.md");

export function findInstructionFiles(cwd: string): string[] {
  return instructionFilePaths.filter((filePath) =>
    fs.existsSync(path.join(cwd, filePath)),
  );
}
