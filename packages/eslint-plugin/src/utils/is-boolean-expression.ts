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
  if (node.type !== AST_NODE_TYPES.Identifier) return false;

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
    return false;
  }

  // Only follow earlier initializers, so forward references and cycles stop here.
  return isBooleanExpression(definition.node.init, sourceCode);
}
