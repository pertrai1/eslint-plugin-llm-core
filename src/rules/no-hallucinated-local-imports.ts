import { existsSync, readFileSync, statSync } from "node:fs";
import * as path from "node:path";
import { TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds =
  | "missingLocalModule"
  | "missingNamedExport"
  | "missingDefaultExport";

type ExportSurface = {
  named: Set<string>;
  hasDefault: boolean;
};

const moduleExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

function isRelativeImport(source: string): boolean {
  return ["./", "../"].some((prefix) => source.startsWith(prefix));
}

function isFile(filename: string): boolean {
  try {
    return statSync(filename).isFile();
  } catch {
    return false;
  }
}

function resolveLocalModule(
  fromFilename: string,
  source: string,
): string | null {
  const basePath = path.resolve(path.dirname(fromFilename), source);

  if (existsSync(basePath) && isFile(basePath)) {
    return basePath;
  }

  for (const extension of moduleExtensions) {
    const candidate = `${basePath}${extension}`;
    if (isFile(candidate)) {
      return candidate;
    }
  }

  for (const extension of moduleExtensions) {
    const candidate = path.join(basePath, `index${extension}`);
    if (isFile(candidate)) {
      return candidate;
    }
  }

  return null;
}

function stripComments(sourceText: string): string {
  return sourceText.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function getDirectExportSurface(filename: string): ExportSurface | null {
  let sourceText: string;
  try {
    sourceText = readFileSync(filename, "utf8");
  } catch {
    return null;
  }

  const named = new Set<string>();
  const text = stripComments(sourceText);
  let hasDefault = /\bexport\s+default\b/.test(text);

  const declarationExportPattern =
    /\bexport\s+(?:declare\s+)?(?:async\s+)?(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;
  let declarationMatch: RegExpExecArray | null;
  while ((declarationMatch = declarationExportPattern.exec(text)) !== null) {
    const [, exportName] = declarationMatch;
    if (exportName !== undefined) {
      if (exportName === "default") {
        hasDefault = true;
      } else {
        named.add(exportName);
      }
    }
  }

  const namedExportPattern = /\bexport\s*\{([^}]*)\}/g;
  let namedExportMatch: RegExpExecArray | null;
  while ((namedExportMatch = namedExportPattern.exec(text)) !== null) {
    const [, specifierList] = namedExportMatch;
    if (specifierList === undefined) {
      continue;
    }

    for (const rawSpecifier of specifierList.split(",")) {
      const specifier = rawSpecifier.trim();
      if (specifier.length === 0 || /\sfrom\s/.test(specifier)) {
        continue;
      }

      const parts = specifier.split(/\s+as\s+/);
      const exportName = (parts[1] ?? parts[0])?.trim();
      if (exportName === "default") {
        hasDefault = true;
      } else if (
        exportName !== undefined &&
        /^[A-Za-z_$][\w$]*$/.test(exportName)
      ) {
        named.add(exportName);
      }
    }
  }

  return { named, hasDefault };
}

function getImportedName(specifier: TSESTree.ImportSpecifier): string | null {
  if (specifier.imported.type === "Identifier") {
    return specifier.imported.name;
  }

  if (typeof specifier.imported.value === "string") {
    return specifier.imported.value;
  }

  return null;
}

function getReExportedLocalName(
  specifier: TSESTree.ExportSpecifier,
): string | null {
  if (specifier.local.type === "Identifier") {
    return specifier.local.name;
  }

  if (typeof specifier.local.value === "string") {
    return specifier.local.value;
  }

  return null;
}

export default createRule<[], MessageIds>({
  name: "no-hallucinated-local-imports",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow static relative imports and re-exports that reference missing local modules or named exports",
    },
    messages: {
      missingLocalModule: [
        "Relative import points to a local module that does not exist.",
        "",
        "Why: LLMs often invent nearby file names that sound plausible but are not in the repo.",
        "This creates code that fails at runtime or during build resolution.",
        "",
        "How to fix:",
        "  Check the target filename and update the import to an existing local module.",
      ].join("\n"),
      missingNamedExport: [
        "Named import does not exist in the target local module's direct exports.",
        "",
        "Why: LLMs often invent helper names that sound adjacent to real exports.",
        "This creates code that fails during module binding or type checking.",
        "",
        "How to fix:",
        "  Import an exported name from the target module, or add the missing export intentionally.",
      ].join("\n"),
      missingDefaultExport: [
        "Default import points to a local module that does not have a default export.",
        "",
        "Why: LLMs often assume a file exports a default when it only has named exports.",
        "This creates code that fails during module binding.",
        "",
        "How to fix:",
        "  Import named exports using destructuring, or add a default export to the target module.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function resolveSource(
      node:
        | TSESTree.ImportDeclaration
        | TSESTree.ExportNamedDeclaration
        | TSESTree.ExportAllDeclaration,
    ): string | null {
      if (node.source === null) {
        return null;
      }

      const source = node.source.value;
      if (typeof source !== "string" || !isRelativeImport(source)) {
        return null;
      }

      const filename = context.filename;
      if (filename === "<input>" || filename === "<text>") {
        return null;
      }

      const resolvedModule = resolveLocalModule(filename, source);
      if (resolvedModule === null) {
        context.report({
          node: node.source,
          messageId: "missingLocalModule",
        });
        return null;
      }

      return resolvedModule;
    }

    function checkNamedImport(
      specifier: TSESTree.ImportSpecifier | TSESTree.ExportSpecifier,
      name: string | null,
      namedExports: Set<string> | null,
    ): void {
      if (name === null || namedExports === null || namedExports.has(name)) {
        return;
      }

      context.report({
        node: specifier,
        messageId: "missingNamedExport",
      });
    }

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        const resolvedModule = resolveSource(node);
        if (resolvedModule === null) {
          return;
        }

        const exportSurface = getDirectExportSurface(resolvedModule);
        if (exportSurface === null) {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportSpecifier") {
            checkNamedImport(
              specifier,
              getImportedName(specifier),
              exportSurface.named,
            );
          } else if (specifier.type === "ImportDefaultSpecifier") {
            if (!exportSurface.hasDefault) {
              context.report({
                node: specifier,
                messageId: "missingDefaultExport",
              });
            }
          }
        }
      },
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration) {
        const resolvedModule = resolveSource(node);
        if (resolvedModule === null) {
          return;
        }

        const exportSurface = getDirectExportSurface(resolvedModule);
        if (exportSurface === null) {
          return;
        }

        for (const specifier of node.specifiers) {
          checkNamedImport(
            specifier,
            getReExportedLocalName(specifier),
            exportSurface.named,
          );
        }
      },
      ExportAllDeclaration(node: TSESTree.ExportAllDeclaration) {
        resolveSource(node);
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Do not invent relative local import paths or named imports — verify the target file and exported name exist before importing or re-exporting from it",
};
