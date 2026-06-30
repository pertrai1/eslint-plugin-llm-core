import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { builtinModules } from "node:module";
import * as path from "node:path";
import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type Options = [
  {
    packageJsonPath?: string;
    workspace?: boolean;
    allow?: string[];
    checkDevDependencies?: boolean;
    checkPeerDependencies?: boolean;
    checkOptionalDependencies?: boolean;
    checkDynamicImports?: boolean;
    checkRequire?: boolean;
  },
];

type MessageIds = "undeclaredPackage";

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  workspaces?: string[] | { packages?: string[] };
  name?: string;
};

type DependencyOptions = Required<
  Omit<Options[0], "packageJsonPath" | "allow">
> & {
  allow: string[];
};

const defaultOptions: Options = [
  {
    workspace: true,
    allow: [],
    checkDevDependencies: true,
    checkPeerDependencies: true,
    checkOptionalDependencies: true,
    checkDynamicImports: true,
    checkRequire: false,
  },
];

const nodeBuiltins = new Set(
  builtinModules.flatMap((name) => [name, name.replace(/^node:/, "")]),
);
const dependencyCache = new Map<string, Set<string> | null>();

function normalizeOptions(options: Options[0] | undefined): DependencyOptions {
  const defaults = defaultOptions[0];
  return {
    workspace: options?.workspace ?? defaults.workspace ?? true,
    allow: options?.allow ?? defaults.allow ?? [],
    checkDevDependencies:
      options?.checkDevDependencies ?? defaults.checkDevDependencies ?? true,
    checkPeerDependencies:
      options?.checkPeerDependencies ?? defaults.checkPeerDependencies ?? true,
    checkOptionalDependencies:
      options?.checkOptionalDependencies ??
      defaults.checkOptionalDependencies ??
      true,
    checkDynamicImports:
      options?.checkDynamicImports ?? defaults.checkDynamicImports ?? true,
    checkRequire: options?.checkRequire ?? defaults.checkRequire ?? false,
  };
}

function isPackageJson(value: unknown): value is PackageJson {
  return value !== null && typeof value === "object";
}

function readPackageJson(packageJsonPath: string): PackageJson | null {
  try {
    const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as unknown;
    return isPackageJson(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isFile(filename: string): boolean {
  try {
    return statSync(filename).isFile();
  } catch {
    return false;
  }
}

function isDirectory(dirname: string): boolean {
  try {
    return statSync(dirname).isDirectory();
  } catch {
    return false;
  }
}

function findNearestPackageJson(filename: string): string | null {
  let current = path.dirname(filename);

  while (true) {
    const candidate = path.join(current, "package.json");
    if (isFile(candidate)) {
      return candidate;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }

    current = parent;
  }
}

function getDependencyNames(
  packageJson: PackageJson,
  options: DependencyOptions,
): Set<string> {
  const dependencies = new Set(Object.keys(packageJson.dependencies ?? {}));

  if (options.checkDevDependencies) {
    for (const dependency of Object.keys(packageJson.devDependencies ?? {})) {
      dependencies.add(dependency);
    }
  }

  if (options.checkPeerDependencies) {
    for (const dependency of Object.keys(packageJson.peerDependencies ?? {})) {
      dependencies.add(dependency);
    }
  }

  if (options.checkOptionalDependencies) {
    for (const dependency of Object.keys(
      packageJson.optionalDependencies ?? {},
    )) {
      dependencies.add(dependency);
    }
  }

  for (const allowed of options.allow) {
    dependencies.add(allowed);
  }

  return dependencies;
}

function getWorkspacePatterns(packageJson: PackageJson): string[] {
  if (Array.isArray(packageJson.workspaces)) {
    return packageJson.workspaces;
  }

  if (Array.isArray(packageJson.workspaces?.packages)) {
    return packageJson.workspaces.packages;
  }

  return [];
}

function getWorkspacePackageDirs(rootDir: string, pattern: string): string[] {
  if (!pattern.endsWith("/*")) {
    return [];
  }

  const parentDir = path.join(rootDir, pattern.slice(0, -2));
  if (!isDirectory(parentDir)) {
    return [];
  }

  return readdirSync(parentDir)
    .map((entry) => path.join(parentDir, entry))
    .filter(isDirectory);
}

function addWorkspacePackageNames(
  dependencies: Set<string>,
  packageJsonPath: string,
  packageJson: PackageJson,
): void {
  const rootDir = path.dirname(packageJsonPath);

  for (const pattern of getWorkspacePatterns(packageJson)) {
    for (const packageDir of getWorkspacePackageDirs(rootDir, pattern)) {
      const workspacePackageJson = readPackageJson(
        path.join(packageDir, "package.json"),
      );
      if (typeof workspacePackageJson?.name === "string") {
        dependencies.add(workspacePackageJson.name);
      }
    }
  }
}

function resolvePackageJsonPath(
  filename: string,
  packageJsonPath: string | undefined,
): string | null {
  if (packageJsonPath !== undefined) {
    return path.resolve(packageJsonPath);
  }

  if (filename === "<input>" || filename === "<text>") {
    return null;
  }

  return findNearestPackageJson(filename);
}

function loadDeclaredPackages(
  filename: string,
  rawOptions: Options[0] | undefined,
): Set<string> | null {
  const packageJsonPath = resolvePackageJsonPath(
    filename,
    rawOptions?.packageJsonPath,
  );
  if (packageJsonPath === null || !existsSync(packageJsonPath)) {
    return null;
  }

  const options = normalizeOptions(rawOptions);
  const cacheKey = JSON.stringify({ packageJsonPath, options });
  const cached = dependencyCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const packageJson = readPackageJson(packageJsonPath);
  if (packageJson === null) {
    dependencyCache.set(cacheKey, null);
    return null;
  }

  const dependencies = getDependencyNames(packageJson, options);
  if (options.workspace) {
    addWorkspacePackageNames(dependencies, packageJsonPath, packageJson);
  }

  dependencyCache.set(cacheKey, dependencies);
  return dependencies;
}

function isRelativeOrAbsoluteSpecifier(source: string): boolean {
  return (
    source.startsWith("./") ||
    source.startsWith("../") ||
    source.startsWith("/")
  );
}

function getPackageRoot(source: string): string | null {
  if (isRelativeOrAbsoluteSpecifier(source) || source.startsWith("#")) {
    return null;
  }

  if (source.startsWith("node:")) {
    return null;
  }

  if (source.startsWith("@")) {
    const [scope, name] = source.split("/");
    return scope !== undefined && name !== undefined
      ? `${scope}/${name}`
      : null;
  }

  return source.split("/")[0] ?? null;
}

function isBuiltinPackage(source: string, packageRoot: string): boolean {
  if (source.startsWith("node:")) {
    return true;
  }

  return nodeBuiltins.has(source) || nodeBuiltins.has(packageRoot);
}

export default createRule<Options, MessageIds>({
  name: "no-hallucinated-package-imports",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow package imports and re-exports whose package root is not declared in the relevant package manifest",
    },
    messages: {
      undeclaredPackage: [
        "Package import is not declared in the relevant package manifest.",
        "",
        "Why: LLMs often invent plausible package names or assume dependencies are installed.",
        "Undeclared imports hide dependency changes and fail at install, build, test, or runtime.",
        "",
        "How to fix:",
        "  Use an existing declared dependency, add the package intentionally to package.json, or add a configured allowlist/workspace entry for internal modules.",
      ].join("\n"),
    },
    schema: [
      {
        type: "object",
        properties: {
          packageJsonPath: { type: "string" },
          workspace: { type: "boolean" },
          allow: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
          checkDevDependencies: { type: "boolean" },
          checkPeerDependencies: { type: "boolean" },
          checkOptionalDependencies: { type: "boolean" },
          checkDynamicImports: { type: "boolean" },
          checkRequire: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions,
  create(context, [rawOptions]) {
    const declaredPackages = loadDeclaredPackages(context.filename, rawOptions);
    const options = normalizeOptions(rawOptions);

    function checkSource(node: TSESTree.Node, source: string): void {
      const packageRoot = getPackageRoot(source);
      if (packageRoot === null || isBuiltinPackage(source, packageRoot)) {
        return;
      }

      if (declaredPackages === null) {
        return;
      }

      if (
        declaredPackages.has(source) ||
        declaredPackages.has(packageRoot) ||
        options.allow.includes(source) ||
        options.allow.includes(packageRoot)
      ) {
        return;
      }

      context.report({ node, messageId: "undeclaredPackage" });
    }

    function checkLiteralSource(
      node: TSESTree.Node,
      source: TSESTree.StringLiteral | null,
    ): void {
      if (source !== null && typeof source.value === "string") {
        checkSource(source, source.value);
      }
    }

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        checkLiteralSource(node, node.source);
      },
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration) {
        checkLiteralSource(node, node.source);
      },
      ExportAllDeclaration(node: TSESTree.ExportAllDeclaration) {
        checkLiteralSource(node, node.source);
      },
      ImportExpression(node: TSESTree.ImportExpression) {
        if (!options.checkDynamicImports) {
          return;
        }

        if (
          node.source.type === AST_NODE_TYPES.Literal &&
          typeof node.source.value === "string"
        ) {
          checkSource(node.source, node.source.value);
        }
      },
      CallExpression(node: TSESTree.CallExpression) {
        if (!options.checkRequire) {
          return;
        }

        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          node.callee.name !== "require"
        ) {
          return;
        }

        const [firstArgument] = node.arguments;
        if (
          firstArgument?.type === AST_NODE_TYPES.Literal &&
          typeof firstArgument.value === "string"
        ) {
          checkSource(firstArgument, firstArgument.value);
        }
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Do not invent or silently import undeclared packages — verify package roots are declared in package.json or explicitly allowlisted before importing them",
};
