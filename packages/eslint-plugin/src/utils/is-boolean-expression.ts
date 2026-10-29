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
