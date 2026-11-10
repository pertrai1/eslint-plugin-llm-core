import { parseArgs } from "../../../../evals/src/run-eval";
import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { expect, it } from "vitest";

it("parses repeated rule flags without running an eval on import", () => {
  const entry = resolve(__dirname, "../../../../evals/src/run-eval.ts");
  const code = `const { parseArgs } = require(${JSON.stringify(entry)}); process.stdout.write(JSON.stringify(parseArgs(["node", "eval", "--rule", "structured-logging", "--rule", "no-magic-numbers", "--rule", "structured-logging"]).ruleFilter));`;
  const output = execFileSync(
    process.execPath,
    ["--import", "tsx", "-e", code],
    { encoding: "utf8", env: { ...process.env, ANTHROPIC_API_KEY: "" } },
  );
  expect(JSON.parse(output)).toEqual([
    "no-magic-numbers",
    "structured-logging",
  ]);
});

it.each([[], [""], ["--mode", "control"]])(
  "rejects a missing rule value %j before writing reports",
  (...values) => {
    const output = mkdtempSync(resolve(tmpdir(), "eval-invalid-"));
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        resolve(__dirname, "../../../../evals/src/run-eval.ts"),
        "--output",
        output,
        "--rule",
        ...values,
      ],
      { encoding: "utf8", env: { ...process.env, ANTHROPIC_API_KEY: "" } },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("--rule requires a short rule name");
    expect(readdirSync(output)).toEqual([]);
  },
);

it("rejects rule selection with replay before reading the trace", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      resolve(__dirname, "../../../../evals/src/run-eval.ts"),
      "--rule",
      "no-magic-numbers",
      "--replay",
      "/missing-trace.json",
    ],
    { encoding: "utf8", env: { ...process.env, ANTHROPIC_API_KEY: "" } },
  );
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("replay uses the recorded prompt");
});

it("runs both modes with selected rules and writes selection metadata without credentials", () => {
  const output = mkdtempSync(resolve(tmpdir(), "eval-selected-"));
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      resolve(__dirname, "../../../../evals/src/run-eval.ts"),
      "--output",
      output,
      "--rule",
      "max-file-length",
      "--fixture",
      "api-service.ts",
      "--mode",
      "both",
    ],
    { encoding: "utf8", env: { ...process.env, ANTHROPIC_API_KEY: "" } },
  );
  expect(result.status).toBe(0);
  expect(result.stdout).toContain("rules:          max-file-length");
  const json = readdirSync(output).find((name) => name.endsWith(".json"))!;
  const report = JSON.parse(readFileSync(resolve(output, json), "utf8"));
  expect(report.ruleFilter).toEqual(["max-file-length"]);
  expect(report.results).toEqual([
    expect.objectContaining({
      mode: "treatment",
      resolved: true,
      iterations: 0,
    }),
    expect.objectContaining({ mode: "control", resolved: true, iterations: 0 }),
  ]);
  const rows = readFileSync(resolve(output, "history.jsonl"), "utf8")
    .trim()
    .split("\n");
  expect(rows).toHaveLength(2);
  expect(JSON.parse(rows[0]!).ruleFilter).toEqual(["max-file-length"]);
  expect(JSON.parse(rows[1]!).ruleFilter).toEqual(["max-file-length"]);
});

it("documents repeatable short-name rule selection in help", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      resolve(__dirname, "../../../../evals/src/run-eval.ts"),
      "--help",
    ],
    { encoding: "utf8" },
  );
  expect(result.status).toBe(0);
  expect(result.stdout).toContain("--rule <short-name>");
  expect(result.stdout).toMatch(/--rule.*repeatable/);
});

it.each([
  "unknown-rule",
  "__esModule",
  "llm-core/no-magic-numbers",
  "no-magic-numbers,structured-logging",
  "No-Magic-Numbers",
])("rejects mixed valid/invalid CLI rules %s before report writes", (name) => {
  const output = mkdtempSync(resolve(tmpdir(), "eval-invalid-"));
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      resolve(__dirname, "../../../../evals/src/run-eval.ts"),
      "--output",
      output,
      "--rule",
      "no-magic-numbers",
      "--rule",
      name,
    ],
    { encoding: "utf8", env: { ...process.env, ANTHROPIC_API_KEY: "" } },
  );
  expect(result.status).toBe(1);
  expect(result.stderr).toContain(`Invalid rule "${name}"`);
  expect(result.stderr).toContain("Use exact short names");
  expect(readdirSync(output)).toEqual([]);
});

it("preserves defaults when no rule flag is supplied", () => {
  expect(parseArgs(["node", "eval"])).toMatchObject({
    mode: "both",
    fixtureFilter: [],
    ruleFilter: [],
    maxIterations: 5,
    compact: false,
    replayFile: null,
    replayIteration: null,
  });
});

it("preserves fixture, mode and iteration options with reordered rule flags", () => {
  expect(
    parseArgs([
      "node",
      "eval",
      "--rule",
      "structured-logging",
      "--fixture",
      "api-service.ts",
      "--mode",
      "control",
      "--max-iterations",
      "2",
      "--rule",
      "no-magic-numbers",
    ]).ruleFilter,
  ).toEqual(
    parseArgs([
      "node",
      "eval",
      "--rule",
      "no-magic-numbers",
      "--rule",
      "structured-logging",
    ]).ruleFilter,
  );
  expect(
    parseArgs([
      "node",
      "eval",
      "--rule",
      "no-magic-numbers",
      "--fixture",
      "api-service.ts",
      "--mode",
      "control",
      "--max-iterations",
      "2",
    ]),
  ).toMatchObject({
    fixtureFilter: ["api-service.ts"],
    mode: "control",
    maxIterations: 2,
  });
});
