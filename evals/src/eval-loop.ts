import { readFile } from "fs/promises";
import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import { parse } from "@typescript-eslint/parser";
import type {
  EvalMode,
  FixtureResult,
  IterationRecord,
  LintViolation,
} from "./types";
import { fixViolations } from "./llm-client";
import { lintCode } from "./linter";
import { stripViolationMessages } from "./strip-messages";
import { computeViolationDiff } from "./violation-diff";
import { computeCodeDiff } from "./code-diff";
import { detectPatterns } from "./patterns";

function basename(filePath: string): string {
  return filePath.split("/").pop() ?? filePath;
}

function pushExportedName(
  names: Set<string>,
  declaration:
    | TSESTree.ExportDefaultDeclaration["declaration"]
    | TSESTree.ExportNamedDeclaration["declaration"],
): void {
  if (!declaration) {
    return;
  }

  if (
    declaration.type === AST_NODE_TYPES.FunctionDeclaration ||
    declaration.type === AST_NODE_TYPES.ClassDeclaration
  ) {
    if (declaration.id) {
      names.add(declaration.id.name);
    }
    return;
  }

  if (declaration.type === AST_NODE_TYPES.VariableDeclaration) {
    for (const declarator of declaration.declarations) {
      if (declarator.id.type === AST_NODE_TYPES.Identifier) {
        names.add(declarator.id.name);
      }
    }
    return;
  }

  if (
    declaration.type === AST_NODE_TYPES.TSTypeAliasDeclaration ||
    declaration.type === AST_NODE_TYPES.TSInterfaceDeclaration ||
    declaration.type === AST_NODE_TYPES.TSEnumDeclaration
  ) {
    names.add(declaration.id.name);
  }
}

export function collectExportedSymbolNames(code: string): string[] {
  const ast = parse(code, {
    ecmaVersion: 2022,
    sourceType: "module",
  });
  const names = new Set<string>();

  for (const node of ast.body) {
    if (node.type === AST_NODE_TYPES.ExportNamedDeclaration) {
      if (node.declaration) {
        pushExportedName(names, node.declaration);
      }

      if (node.source) {
        continue;
      }

      for (const specifier of node.specifiers) {
        if (specifier.type !== AST_NODE_TYPES.ExportSpecifier) continue;
        if (specifier.exported.type === AST_NODE_TYPES.Identifier) {
          names.add(specifier.exported.name);
        }
      }
    }

    if (node.type === AST_NODE_TYPES.ExportDefaultDeclaration) {
      pushExportedName(names, node.declaration);
    }
  }

  return [...names].sort((a, b) => a.localeCompare(b));
}

export function preservesExportedApi(
  originalCode: string,
  candidateCode: string,
): boolean {
  const originalExports = collectExportedSymbolNames(originalCode);
  const candidateExports = new Set(collectExportedSymbolNames(candidateCode));

  return originalExports.every((name) => candidateExports.has(name));
}

function prepareViolationsForMode(
  violations: LintViolation[],
  mode: EvalMode,
): LintViolation[] {
  return mode === "treatment" ? violations : stripViolationMessages(violations);
}

export async function runFixture(
  fixturePath: string,
  mode: EvalMode,
  options: { model: string; maxIterations: number },
): Promise<FixtureResult> {
  const fixtureName = basename(fixturePath);
  const initialCode = await readFile(fixturePath, "utf-8");
  const fixtureStartedAt = new Date();

  let currentCode = initialCode;
  let currentViolations = lintCode(currentCode);

  const iterationRecords: IterationRecord[] = [];
  let iterations = 0;

  while (currentViolations.length > 0 && iterations < options.maxIterations) {
    iterations++;
    const iterStartedAt = new Date();
    const violationsBefore = currentViolations.length;

    const violationsForLlm = prepareViolationsForMode(currentViolations, mode);
    const fixResult = await fixViolations(
      currentCode,
      violationsForLlm,
      options.model,
    );

    if (!preservesExportedApi(initialCode, fixResult.code)) {
      const iterCompletedAt = new Date();
      iterationRecords.push({
        iteration: iterations,
        violationsBefore,
        violationsAfter: currentViolations.length,
        rejectedCandidate: "dropped-exported-api",
        remainingRuleIds: [
          ...new Set(currentViolations.map((v) => v.ruleId)),
        ].sort((a, b) => a.localeCompare(b)),
        promptSent: fixResult.prompt,
        llmResponse: fixResult.rawResponse,
        codeDiff: computeCodeDiff(currentCode, fixResult.code),
        tokenUsage: fixResult.tokenUsage,
        reasoning: fixResult.reasoning,
        violationDiff: computeViolationDiff(
          currentViolations,
          currentViolations,
        ),
        startedAt: iterStartedAt.toISOString(),
        completedAt: iterCompletedAt.toISOString(),
        durationMs: iterCompletedAt.getTime() - iterStartedAt.getTime(),
      });
      continue;
    }

    const newViolations = lintCode(fixResult.code);
    const iterCompletedAt = new Date();

    iterationRecords.push({
      iteration: iterations,
      violationsBefore,
      violationsAfter: newViolations.length,
      remainingRuleIds: [...new Set(newViolations.map((v) => v.ruleId))].sort(
        (a, b) => a.localeCompare(b),
      ),
      promptSent: fixResult.prompt,
      llmResponse: fixResult.rawResponse,
      codeDiff: computeCodeDiff(currentCode, fixResult.code),
      tokenUsage: fixResult.tokenUsage,
      reasoning: fixResult.reasoning,
      violationDiff: computeViolationDiff(currentViolations, newViolations),
      startedAt: iterStartedAt.toISOString(),
      completedAt: iterCompletedAt.toISOString(),
      durationMs: iterCompletedAt.getTime() - iterStartedAt.getTime(),
    });

    currentCode = fixResult.code;
    currentViolations = newViolations;
  }

  const fixtureCompletedAt = new Date();

  return {
    fixture: fixtureName,
    mode,
    iterations,
    resolved: currentViolations.length === 0,
    iterationRecords,
    finalViolationCount: currentViolations.length,
    patterns: detectPatterns(iterationRecords),
    startedAt: fixtureStartedAt.toISOString(),
    completedAt: fixtureCompletedAt.toISOString(),
    durationMs: fixtureCompletedAt.getTime() - fixtureStartedAt.getTime(),
  };
}
