import path from "node:path";
import { readdir } from "node:fs/promises";

// Extensions ESLint may lint; used to estimate a directory's size for the cap.
const LINTABLE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

// Directories excluded from the file-count estimate (never linted in practice).
const SKIPPED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
]);

/**
 * Counts lintable source files under `dir`, short-circuiting once the count
 * exceeds `limit`. A conservative estimate for the directory guard — it ignores
 * ESLint's own ignore rules, so it may over-count, which only makes the guard
 * safer.
 */
export async function countSourceFiles(
  dir: string,
  limit: number,
): Promise<number> {
  let count = 0;
  const pending: string[] = [dir];

  while (pending.length > 0) {
    const current = pending.pop() as string;
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) {
          pending.push(path.join(current, entry.name));
        }
      } else if (
        entry.isFile() &&
        LINTABLE_EXTENSIONS.has(path.extname(entry.name))
      ) {
        count += 1;
        if (count > limit) {
          return count;
        }
      }
    }
  }

  return count;
}
