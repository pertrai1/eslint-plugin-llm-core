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

export function computeRelativePath(targetFile: string): string {
  return path
    .relative(path.dirname(targetFile), lintingRulesPath)
    .split(path.sep)
    .join("/");
}

export function buildInjectionBlock(relativePath: string): string {
  return `${injectionBlockStart}\nSee [\`.agents/linting-rules.md\`](${relativePath}) for coding guidelines derived from your ESLint config.\nRegenerate with: \`npx llm-core-instructions\`\n${injectionBlockEnd}`;
}

function isMarkerLine(content: string, index: number, marker: string): boolean {
  const end = index + marker.length;

  return (
    (index === 0 || content[index - 1] === "\n") &&
    (end === content.length ||
      content.startsWith("\n", end) ||
      content.startsWith("\r\n", end))
  );
}

/**
 * Replaces an unambiguous injection block or appends if no markers exist.
 * Ambiguous markers must not turn surrounding text into generated content.
 */
export function replaceOrAppendBlock(content: string, block: string): string {
  const startIdx = content.indexOf(injectionBlockStart);
  const endIdx = content.indexOf(injectionBlockEnd);

  if (startIdx === -1 && endIdx === -1) {
    const trimmed = content.endsWith("\n") ? content : content + "\n";
    return trimmed + block + "\n";
  }

  if (
    startIdx === -1 ||
    endIdx <= startIdx ||
    content.includes(injectionBlockStart, startIdx + 1) ||
    content.includes(injectionBlockEnd, endIdx + 1) ||
    !isMarkerLine(content, startIdx, injectionBlockStart) ||
    !isMarkerLine(content, endIdx, injectionBlockEnd)
  ) {
    throw new Error(
      "ambiguous reference markers; file left unchanged. Repair the marker pair or use --no-inject.",
    );
  }

  const cutEnd = endIdx + injectionBlockEnd.length;
  return content.slice(0, startIdx) + block + content.slice(cutEnd);
}

/**
 * Orchestrates injection: finds existing instruction files at `cwd`,
 * builds blocks with correct relative paths, and writes changes.
 * Returns the list of modified file paths.
 *
 * If a file cannot be safely updated, logs a warning to stderr and continues.
 */
export function injectReferences(cwd: string): string[] {
  const files = findInstructionFiles(cwd);
  const modified: string[] = [];

  for (const target of files) {
    const fullPath = path.join(cwd, target);
    const relativePath = computeRelativePath(target);
    const block = buildInjectionBlock(relativePath);

    try {
      const content = fs.readFileSync(fullPath, "utf-8");
      const updated = replaceOrAppendBlock(content, block);
      if (updated !== content) {
        fs.writeFileSync(fullPath, updated, "utf-8");
        modified.push(target);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(
        `Warning: could not inject reference into ${target}: ${message}\n`,
      );
    }
  }

  return modified;
}
