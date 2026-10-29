import {
  AST_NODE_TYPES,
  ASTUtils,
  TSESLint,
  TSESTree,
} from "@typescript-eslint/utils";

/** Prove a boolean result without relying on names, annotations, or assertions. */
export function isBooleanExpression(
  node: TSESTree.Node,
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  // A with object can shadow otherwise stable variables and built-in names.
  for (
    let scope: TSESLint.Scope.Scope | null = sourceCode.getScope(node);
    scope;
    scope = scope.upper
  ) {
    if (scope.type === "with") return false;
  }

  if (node.type === AST_NODE_TYPES.Literal) {
    return typeof node.value === "boolean";
  }
  if (node.type === AST_NODE_TYPES.UnaryExpression) {
    return node.operator === "!";
  }
  if (node.type === AST_NODE_TYPES.BinaryExpression) {
    return [
      "===",
      "!==",
      "==",
      "!=",
      "<",
      "<=",
      ">",
      ">=",
      "in",
      "instanceof",
    ].includes(node.operator);
  }
  if (node.type === AST_NODE_TYPES.LogicalExpression) {
    return (
      isBooleanExpression(node.left, sourceCode) &&
      isBooleanExpression(node.right, sourceCode)
    );
  }
  if (node.type === AST_NODE_TYPES.CallExpression) {
    return isBuiltinPredicateCall(node, sourceCode);
  }
  if (node.type !== AST_NODE_TYPES.Identifier) return false;

  const binding = getConstInitializer(node, sourceCode);
  return (
    binding !== null && isBooleanExpression(binding.initializer, sourceCode)
  );
}

function getConstInitializer(
  node: TSESTree.Identifier,
  sourceCode: Readonly<TSESLint.SourceCode>,
): {
  initializer: TSESTree.Expression;
  variable: TSESLint.Scope.Variable;
} | null {
  const variable = ASTUtils.findVariable(sourceCode.getScope(node), node);
  const definition = variable?.defs[0];
  if (
    variable?.defs.length !== 1 ||
    definition?.type !== "Variable" ||
    definition.parent.kind !== "const" ||
    definition.node.id.type !== AST_NODE_TYPES.Identifier ||
    !definition.node.init ||
    definition.node.range[1] > node.range[0] ||
    variable.references.some(
      (reference) => reference.isWrite() && !reference.init,
    )
  ) {
    return null;
  }

  // Only follow earlier initializers, so forward references and cycles stop here.
  return { initializer: definition.node.init, variable };
}

function isBuiltinPredicateCall(
  node: TSESTree.CallExpression,
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  const callee = node.callee;
  if (
    node.optional ||
    callee.type !== AST_NODE_TYPES.MemberExpression ||
    callee.optional ||
    callee.computed ||
    callee.property.type !== AST_NODE_TYPES.Identifier
  ) {
    return false;
  }

  const method = callee.property.name;
  let constructor: string;
  switch (method) {
    case "has":
      constructor = "Set";
      break;
    case "test":
      constructor = "RegExp";
      break;
    case "endsWith":
      constructor = "String";
      break;
    default:
      return false;
  }

  let receiver: TSESTree.Node = callee.object;
  if (receiver.type === AST_NODE_TYPES.Identifier) {
    const binding = getConstInitializer(receiver, sourceCode);
    if (!binding) return false;
    receiver = binding.initializer;

    // Strings are immutable. Objects must not escape or have methods replaced.
    const isPrimitiveString =
      (receiver.type === AST_NODE_TYPES.Literal &&
        typeof receiver.value === "string") ||
      receiver.type === AST_NODE_TYPES.TemplateLiteral;
    if (
      !isPrimitiveString &&
      !binding.variable.references.every((reference) => {
        if (reference.init) return true;
        const member = reference.identifier.parent;
        return (
          reference.isReadOnly() &&
          member.type === AST_NODE_TYPES.MemberExpression &&
          member.object === reference.identifier &&
          !member.computed &&
          member.property.type === AST_NODE_TYPES.Identifier &&
          member.property.name === method &&
          member.parent.type === AST_NODE_TYPES.CallExpression &&
          member.parent.callee === member
        );
      })
    )
      return false;
  }

  if (receiver.type === AST_NODE_TYPES.Literal) {
    return (
      (constructor === "String" && typeof receiver.value === "string") ||
      (constructor === "RegExp" && "regex" in receiver)
    );
  }
  if (receiver.type === AST_NODE_TYPES.TemplateLiteral) {
    return constructor === "String";
  }
  if (
    receiver.type !== AST_NODE_TYPES.NewExpression ||
    receiver.callee.type !== AST_NODE_TYPES.Identifier ||
    receiver.callee.name !== constructor
  )
    return false;

  if (hasGlobalObjectMutationOrEscape(sourceCode)) return false;

  const global = ASTUtils.findVariable(
    sourceCode.getScope(receiver.callee),
    receiver.callee,
  );
  return (
    global === null ||
    (global.defs.length === 0 &&
      !global.references.some((reference) => reference.isWrite()))
  );
}

function hasGlobalObjectMutationOrEscape(
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  const globalScope = sourceCode.scopeManager?.globalScope;
  if (!globalScope) return true;

  const globalNames = ["globalThis", "global", "window", "self"];
  const references = [
    ...globalScope.through.filter((reference) =>
      globalNames.includes(reference.identifier.name),
    ),
    ...globalNames.flatMap(
      (name) => globalScope.set.get(name)?.references ?? [],
    ),
  ];

  for (const reference of references) {
    let current: TSESTree.Node = reference.identifier;
    while (
      current.parent?.type === AST_NODE_TYPES.MemberExpression &&
      current.parent.object === current
    ) {
      const member: TSESTree.MemberExpression = current.parent;
      // Computed access or a global-object alias can expose the global itself.
      if (
        member.computed ||
        (member.property.type === AST_NODE_TYPES.Identifier &&
          globalNames.includes(member.property.name))
      )
        return true;
      current = member;
    }

    const parent = current.parent;
    if (!parent) return true;
    // A member can be assigned through a pattern or loop without a direct assignment parent.
    if (
      parent.type === AST_NODE_TYPES.ArrayPattern ||
      parent.type === AST_NODE_TYPES.AssignmentPattern ||
      parent.type === AST_NODE_TYPES.RestElement ||
      parent.type === AST_NODE_TYPES.ChainExpression ||
      parent.type === AST_NODE_TYPES.TSAsExpression ||
      parent.type === AST_NODE_TYPES.TSNonNullExpression ||
      parent.type === AST_NODE_TYPES.TSTypeAssertion ||
      parent.type === AST_NODE_TYPES.TSSatisfiesExpression ||
      (parent.type === AST_NODE_TYPES.Property &&
        parent.parent.type === AST_NODE_TYPES.ObjectPattern) ||
      ((parent.type === AST_NODE_TYPES.ForInStatement ||
        parent.type === AST_NODE_TYPES.ForOfStatement) &&
        parent.left === current)
    )
      return true;
    if (current === reference.identifier) {
      if (
        parent.type === AST_NODE_TYPES.UnaryExpression &&
        (parent.operator === "typeof" || parent.operator === "void")
      )
        continue;
      // Includes aliases, Object.assign/defineProperty, and Reflect.set targets.
      return true;
    }
    if (
      (parent.type === AST_NODE_TYPES.AssignmentExpression &&
        parent.left === current) ||
      (parent.type === AST_NODE_TYPES.UpdateExpression &&
        parent.argument === current) ||
      (parent.type === AST_NODE_TYPES.UnaryExpression &&
        parent.operator === "delete" &&
        parent.argument === current)
    )
      return true;
  }
  return false;
}
