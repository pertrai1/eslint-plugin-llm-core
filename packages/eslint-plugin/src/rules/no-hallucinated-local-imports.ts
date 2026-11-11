import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import * as path from "node:path";
import { TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds =
  "missingLocalModule" | "missingNamedExport" | "missingDefaultExport";

type ExportSurface = {
  named: Set<string>;
  hasDefault: boolean;
};

type ResolvedTarget = {
  source: string;
  surface: ExportSurface;
};

const MAX_LISTED_NAMES = 20;

const moduleExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

function isRelativeImport(source: string): boolean {
  return source.startsWith("./") || source.startsWith("../");
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

function formatNameList(names: string[]): string {
  const listed = names.slice(0, MAX_LISTED_NAMES).join(", ");
  const remaining = names.length - MAX_LISTED_NAMES;
  return remaining > 0 ? `${listed}, and ${remaining} more` : listed;
}

function hasIndexModule(directory: string): boolean {
  return moduleExtensions.some((extension) =>
    isFile(path.join(directory, `index${extension}`)),
  );
}

function listModuleNames(directory: string): string[] {
  const names = new Set<string>();
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const extension = path.extname(entry.name);
    const name = path.basename(entry.name, extension);
    if (entry.isFile() && moduleExtensions.includes(extension)) {
      if (!name.endsWith(".d")) {
        names.add(name);
      }
    } else if (
      entry.isDirectory() &&
      hasIndexModule(path.join(directory, entry.name))
    ) {
      names.add(entry.name);
    }
  }
  return [...names].sort();
}

function describeSiblingModules(fromFilename: string, source: string): string {
  const prefix = source.slice(0, source.lastIndexOf("/") + 1);
  const fromDirectory = path.dirname(fromFilename);
  const directory = path.resolve(fromDirectory, prefix);

  let names: string[];
  try {
    names = listModuleNames(directory);
  } catch {
    return `none (directory '${prefix}' does not exist)`;
  }

  if (directory === fromDirectory) {
    const self = path.basename(fromFilename, path.extname(fromFilename));
    names = names.filter((name) => name !== self);
  }

  return names.length > 0
    ? formatNameList(names.map((name) => `${prefix}${name}`))
    : `none (no other modules found in '${prefix}')`;
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

function describeNamedExports(surface: ExportSurface): string {
  if (surface.named.size > 0) {
    return formatNameList([...surface.named].sort());
  }

  return surface.hasDefault
    ? "none (the module only has a default export)"
    : "none (the module has no direct exports)";
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
        "'{{ source }}' does not resolve to a local module.",
        "",
        "Why: LLMs often invent plausible nearby file names, and the import then fails at build resolution or runtime.",
        "",
        "How to fix:",
        "  Local modules in that directory: {{ siblings }}",
        "  Import from one of those, or create '{{ source }}' intentionally.",
      ].join("\n"),
      missingNamedExport: [
        "'{{ source }}' has no export named '{{ name }}'.",
        "",
        "Why: LLMs often invent helper names adjacent to real exports, and the import then fails at module binding or type checking.",
        "",
        "How to fix:",
        "  Named exports available in '{{ source }}': {{ available }}",
        "  Import one of those names, or add '{{ name }}' to the module intentionally.",
      ].join("\n"),
      missingDefaultExport: [
        "'{{ source }}' has no default export.",
        "",
        "Why: LLMs often assume a default export where a file only has named exports, and the import then fails at module binding.",
        "",
        "How to fix:",
        "  Named exports available in '{{ source }}': {{ available }}",
        "  Import one of those with a named import ({ name }), or add a default export to the module intentionally.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function resolveTarget(
      node:
        | TSESTree.ImportDeclaration
        | TSESTree.ExportNamedDeclaration
        | TSESTree.ExportAllDeclaration,
    ): ResolvedTarget | null {
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
          data: { source, siblings: describeSiblingModules(filename, source) },
        });
        return null;
      }

      const surface = getDirectExportSurface(resolvedModule);
      return surface === null ? null : { source, surface };
    }

    function checkNamedImport(
      specifier: TSESTree.ImportSpecifier | TSESTree.ExportSpecifier,
      name: string | null,
      target: ResolvedTarget,
    ): void {
      if (name === null || target.surface.named.has(name)) {
        return;
      }

      context.report({
        node: specifier,
        messageId: "missingNamedExport",
        data: {
          source: target.source,
          name,
          available: describeNamedExports(target.surface),
        },
      });
    }

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        const target = resolveTarget(node);
        if (target === null) {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportSpecifier") {
            checkNamedImport(specifier, getImportedName(specifier), target);
          } else if (specifier.type === "ImportDefaultSpecifier") {
            if (!target.surface.hasDefault) {
              context.report({
                node: specifier,
                messageId: "missingDefaultExport",
                data: {
                  source: target.source,
                  available: describeNamedExports(target.surface),
                },
              });
            }
          }
        }
      },
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration) {
        const target = resolveTarget(node);
        if (target === null) {
          return;
        }

        for (const specifier of node.specifiers) {
          checkNamedImport(
            specifier,
            getReExportedLocalName(specifier),
            target,
          );
        }
      },
      ExportAllDeclaration(node: TSESTree.ExportAllDeclaration) {
        resolveTarget(node);
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Do not invent relative local import paths or named imports — verify the target file and exported name exist before importing or re-exporting from it",
};
