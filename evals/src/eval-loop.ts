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

  let currentCode = initialCode;
  let currentViolations = lintCode(currentCode);

  const iterationRecords: IterationRecord[] = [];
  let iterations = 0;

  while (currentViolations.length > 0 && iterations < options.maxIterations) {
    iterations++;
    const violationsBefore = currentViolations.length;

    const violationsForLlm = prepareViolationsForMode(currentViolations, mode);
    const candidateCode = await fixViolations(
      currentCode,
      violationsForLlm,
      options.model,
    );

    if (!preservesExportedApi(initialCode, candidateCode)) {
      iterationRecords.push({
        iteration: iterations,
        violationsBefore,
        violationsAfter: currentViolations.length,
        rejectedCandidate: "dropped-exported-api",
        remainingRuleIds: [
          ...new Set(currentViolations.map((v) => v.ruleId)),
        ].sort((a, b) => a.localeCompare(b)),
      });
      continue;
    }

    const newViolations = lintCode(candidateCode);

    iterationRecords.push({
      iteration: iterations,
      violationsBefore,
      violationsAfter: newViolations.length,
      remainingRuleIds: [...new Set(newViolations.map((v) => v.ruleId))].sort(
        (a, b) => a.localeCompare(b),
      ),
    });

    currentCode = candidateCode;
    currentViolations = newViolations;
  }

  return {
    fixture: fixtureName,
    mode,
    iterations,
    resolved: currentViolations.length === 0,
    iterationRecords,
    finalViolationCount: currentViolations.length,
  };
}
