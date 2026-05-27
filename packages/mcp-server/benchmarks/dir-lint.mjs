// fallow-ignore-file unused-file
// Benchmark: ESLint programmatic lint latency vs. file count (PRD Open Q #1).
//
// Validates the lint_file directory cap default (Assumption A1 = 200 files) by
// measuring how long eslint.lintFiles takes over generated TypeScript projects
// of increasing size, using the same flat-config + @typescript-eslint/parser
// path the MCP server uses.
//
// Run from packages/mcp-server: `node benchmarks/dir-lint.mjs`
import { loadESLint } from "eslint";
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

// Generate projects inside benchmarks/ so the temp eslint.config.js can resolve
// eslint-plugin-llm-core from the repo's node_modules (a dir outside the repo
// cannot).
const BENCH_DIR = path.dirname(fileURLToPath(import.meta.url));

const COUNTS = [10, 50, 100, 200, 400, 800];

// A representative file: trips a couple of llm-core rules so rule logic runs.
function sampleFile(i) {
  return [
    `export function fn${i}(a, b, c) {`,
    `  try {`,
    `    return a + b + c;`,
    `  } catch (_e) {}`,
    `}`,
    ``,
  ].join("\n");
}

function eslintConfig(typeAware) {
  const langOpts = typeAware
    ? `languageOptions: { parser: tsParser, parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } }`
    : `languageOptions: { parser: tsParser }`;
  return [
    'import llmCore from "eslint-plugin-llm-core";',
    'import tsParser from "@typescript-eslint/parser";',
    ``,
    `export default [`,
    `  { files: ["**/*.ts"], ${langOpts}, plugins: { "llm-core": llmCore }, rules: { "llm-core/no-empty-catch": "error", "llm-core/max-params": "error" } },`,
    `];`,
    ``,
  ].join("\n");
}

const TSCONFIG = JSON.stringify(
  { compilerOptions: { strict: true, skipLibCheck: true }, include: ["src"] },
  null,
  2,
);

async function setupProject(count, typeAware) {
  const dir = await mkdtemp(path.join(BENCH_DIR, `tmp-${count}-`));
  await writeFile(path.join(dir, "eslint.config.js"), eslintConfig(typeAware));
  if (typeAware) await writeFile(path.join(dir, "tsconfig.json"), TSCONFIG);
  const srcDir = path.join(dir, "src");
  await mkdir(srcDir);
  for (let i = 0; i < count; i++) {
    await writeFile(path.join(srcDir, `f${i}.ts`), sampleFile(i));
  }
  return dir;
}

async function loadFlatESLint() {
  const ESLint = await loadESLint({ useFlatConfig: true });
  return ESLint;
}

async function bench(count, typeAware) {
  const dir = await setupProject(count, typeAware);
  try {
    const ESLint = await loadFlatESLint();
    const eslint = new ESLint({ cwd: dir });
    // Warm one run (parser/plugin/type-info load) then time a clean run.
    await eslint.lintFiles([path.join(dir, "src")]);
    const start = performance.now();
    const results = await eslint.lintFiles([path.join(dir, "src")]);
    const ms = performance.now() - start;
    const violations = results.reduce((n, r) => n + r.messages.length, 0);
    return {
      count,
      ms: Math.round(ms),
      perFile: +(ms / count).toFixed(2),
      violations,
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

console.log("=== AST-only (no type information) ===");
console.log("files\ttotal_ms\tper_file_ms\tviolations");
for (const count of COUNTS) {
  const r = await bench(count, false);
  console.log(`${r.count}\t${r.ms}\t\t${r.perFile}\t\t${r.violations}`);
}

console.log("\n=== Type-aware (projectService) ===");
console.log("files\ttotal_ms\tper_file_ms\tviolations");
for (const count of [50, 100, 200, 400]) {
  const r = await bench(count, true);
  console.log(`${r.count}\t${r.ms}\t\t${r.perFile}\t\t${r.violations}`);
}
