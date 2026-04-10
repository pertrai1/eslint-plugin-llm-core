import path from "path";
import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds = "filenameMismatch";

const IGNORED_FILENAMES = new Set([
  "index",
  "types",
  "constants",
  "enums",
  "errors",
  "utils",
  "helpers",
]);

function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function kebabToPascal(str: string): string {
  const camel = kebabToCamel(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function getBaseName(filename: string): string {
  return filename.replace(/(\.(test|spec))?\.(ts|tsx|js|jsx|mjs|cjs)$/, "");
}

function filenameMatchesExport(filename: string, exportName: string): boolean {
  const base = getBaseName(filename);

  if (base === exportName) return true;
  if (kebabToCamel(base) === exportName) return true;
  if (kebabToPascal(base) === exportName) return true;

  if (base.includes("-")) {
    // Kebab-case is lossy for acronym casing (`kb` vs `KB`), so fall back to a
    // case-insensitive structural comparison once the exact conversions fail.
    const normalizedBase = base.replace(/-/g, "").toLowerCase();
    if (normalizedBase === exportName.toLowerCase()) return true;
  }

  // Also handle PascalCase filename matching camelCase export
  const lowerFirst = base.charAt(0).toLowerCase() + base.slice(1);
  if (lowerFirst === exportName) return true;

  return false;
}

function isIgnoredFile(filename: string): boolean {
  return IGNORED_FILENAMES.has(getBaseName(filename));
}

function isTestFile(filename: string): boolean {
  return /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filename);
}

export default createRule<[], MessageIds>({
  name: "filename-match-export",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce that filenames match their single exported function, class, or component name",
    },
    messages: {
      filenameMismatch: [
        "Filename '{{ filename }}' does not match its single export '{{ exportName }}'.",
        "",
        "Why: Mismatched filenames make code harder to navigate and search.",
        "When a file exports a single function or class, the filename should reflect what it contains.",
        "",
        "How to fix:",
        "  Rename the file to match: {{ expectedFilename }}",
        "  Or rename the export to match the filename.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = path.basename(context.filename);

    if (isIgnoredFile(filename) || isTestFile(filename)) {
      return {};
    }

    const base = getBaseName(filename);
    if (base === "index") {
      return {};
    }

    const exportedNames: { name: string; node: TSESTree.Node }[] = [];

    return {
      ExportNamedDeclaration(node) {
        // Re-exports: export { x } from './y' — skip
        if (node.source) return;

        if (node.declaration) {
          if (
            node.declaration.type === AST_NODE_TYPES.FunctionDeclaration &&
            node.declaration.id
          ) {
            exportedNames.push({
              name: node.declaration.id.name,
              node: node.declaration.id,
            });
          } else if (
            node.declaration.type === AST_NODE_TYPES.ClassDeclaration &&
            node.declaration.id
          ) {
            exportedNames.push({
              name: node.declaration.id.name,
              node: node.declaration.id,
            });
          } else if (
            node.declaration.type === AST_NODE_TYPES.VariableDeclaration
          ) {
            for (const declarator of node.declaration.declarations) {
              if (declarator.id.type === AST_NODE_TYPES.Identifier) {
                exportedNames.push({
                  name: declarator.id.name,
                  node: declarator.id,
                });
              }
            }
          } else if (
            node.declaration.type === AST_NODE_TYPES.TSEnumDeclaration &&
            node.declaration.id
          ) {
            exportedNames.push({
              name: node.declaration.id.name,
              node: node.declaration.id,
            });
          } else if (
            node.declaration.type === AST_NODE_TYPES.TSTypeAliasDeclaration &&
            node.declaration.id
          ) {
            exportedNames.push({
              name: node.declaration.id.name,
              node: node.declaration.id,
            });
          } else if (
            node.declaration.type === AST_NODE_TYPES.TSInterfaceDeclaration &&
            node.declaration.id
          ) {
            exportedNames.push({
              name: node.declaration.id.name,
              node: node.declaration.id,
            });
          }
        }

        // Named specifiers: export { foo, bar }
        for (const specifier of node.specifiers) {
          if (specifier.type === AST_NODE_TYPES.ExportSpecifier) {
            const exported = specifier.exported;
            if (exported.type === AST_NODE_TYPES.Identifier) {
              exportedNames.push({ name: exported.name, node: exported });
            }
          }
        }
      },

      ExportDefaultDeclaration(node) {
        const declaration = node.declaration;

        if (
          declaration.type === AST_NODE_TYPES.FunctionDeclaration &&
          declaration.id
        ) {
          exportedNames.push({
            name: declaration.id.name,
            node: declaration.id,
          });
        } else if (
          declaration.type === AST_NODE_TYPES.ClassDeclaration &&
          declaration.id
        ) {
          exportedNames.push({
            name: declaration.id.name,
            node: declaration.id,
          });
        } else if (declaration.type === AST_NODE_TYPES.Identifier) {
          exportedNames.push({
            name: declaration.name,
            node: declaration,
          });
        }
        // Anonymous defaults are not named — nothing to match
      },

      "Program:exit"() {
        if (exportedNames.length !== 1) return;

        const { name: exportName, node: exportNode } = exportedNames[0];

        if (filenameMatchesExport(filename, exportName)) return;

        const ext = filename.slice(filename.indexOf("."));
        // Determine expected filename style based on current filename convention
        const hasKebab = base.includes("-");
        let expectedBase: string;
        if (hasKebab) {
          // Convert export name to kebab-case
          expectedBase = exportName
            .replace(/([a-z])([A-Z])/g, "$1-$2")
            .toLowerCase();
        } else {
          expectedBase = exportName;
        }

        context.report({
          node: exportNode,
          messageId: "filenameMismatch",
          data: {
            filename,
            exportName,
            expectedFilename: `${expectedBase}${ext}`,
          },
        });
      },
    };
  },
});
