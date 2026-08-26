import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "widenThenAssert";

type TypeAssertionExpression =
  TSESTree.TSAsExpression | TSESTree.TSTypeAssertion;

const CONCRETE_INITIALIZER_TYPES = new Set<string>([
  AST_NODE_TYPES.Literal,
  AST_NODE_TYPES.TemplateLiteral,
  AST_NODE_TYPES.ObjectExpression,
  AST_NODE_TYPES.ArrayExpression,
  AST_NODE_TYPES.NewExpression,
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionExpression,
]);

function isNullishKeyword(node: TSESTree.TypeNode): boolean {
  return (
    node.type === AST_NODE_TYPES.TSNullKeyword ||
    node.type === AST_NODE_TYPES.TSUndefinedKeyword
  );
}

function isAnyOrUnknownKeyword(node: TSESTree.TypeNode): boolean {
  return (
    node.type === AST_NODE_TYPES.TSAnyKeyword ||
    node.type === AST_NODE_TYPES.TSUnknownKeyword
  );
}

/**
 * Returns the sole non-nullish member of `T | undefined` / `T | null` / `T | null | undefined`,
 * or null if the union doesn't match that shape. `any`/`unknown` are never treated as the
 * concrete member — `no-type-system-bypass` already owns that widening.
 */
function getWidenedConcreteType(
  typeAnnotation: TSESTree.TypeNode,
): TSESTree.TypeNode | null {
  if (typeAnnotation.type !== AST_NODE_TYPES.TSUnionType) return null;

  const concreteMembers = typeAnnotation.types.filter(
    (member) => !isNullishKeyword(member),
  );
  const nullishMembers = typeAnnotation.types.filter(isNullishKeyword);

  if (concreteMembers.length !== 1 || nullishMembers.length === 0) {
    return null;
  }

  const [concreteMember] = concreteMembers;
  if (isAnyOrUnknownKeyword(concreteMember!)) return null;

  return concreteMember!;
}

function isProvablyConcreteValue(node: TSESTree.Expression): boolean {
  if (node.type === AST_NODE_TYPES.Literal) {
    return node.value !== null;
  }

  return CONCRETE_INITIALIZER_TYPES.has(node.type);
}

function isTypeAssertionExpression(
  node: TSESTree.Node,
): node is TypeAssertionExpression {
  return (
    node.type === AST_NODE_TYPES.TSAsExpression ||
    node.type === AST_NODE_TYPES.TSTypeAssertion
  );
}

/**
 * `var` is function/module-scoped, not block-scoped, so `getScope` on a `var` declarator
 * nested in a block resolves to the wrong scope and misses its variable. Hoisting also means
 * a read before this declarator can be genuinely `undefined` at runtime, which `let`/`const`
 * (TDZ) can't produce — so "remove the added undefined" would be unsafe advice for `var`.
 */
function isVarDeclarator(node: TSESTree.VariableDeclarator): boolean {
  const parent = (node as TSESTree.Node & { parent?: TSESTree.Node }).parent;
  return (
    parent?.type === AST_NODE_TYPES.VariableDeclaration && parent.kind === "var"
  );
}

export default createRule<[], MessageIds>({
  name: "no-widen-then-assert",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow declaring a variable's type wider than its value, then asserting it back to the narrow type",
    },
    messages: {
      widenThenAssert: [
        "'{{ name }}' was declared as '{{ widenedType }}', then forced back to '{{ concreteType }}' here.",
        "",
        "Why: The declaration says this value might be '{{ nullishPart }}', but it was initialized with a",
        "concrete value and never reassigned. Asserting it back to '{{ concreteType }}' at the point of use",
        "fabricates evidence the compiler never actually had — it doesn't fix a real nullability concern,",
        "it just launders a type the code never needed to widen.",
        "",
        "How to fix:",
        "  Remove the added '{{ nullishPart }}' from the declared type so it stays '{{ concreteType }}' throughout.",
        "  If the value can genuinely be absent later, handle that with a check instead of an assertion.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      VariableDeclarator(node: TSESTree.VariableDeclarator) {
        if (isVarDeclarator(node)) return;
        if (node.id.type !== AST_NODE_TYPES.Identifier) return;
        const id = node.id;
        if (!id.typeAnnotation) return;
        if (!node.init || !isProvablyConcreteValue(node.init)) return;

        const declaredType = id.typeAnnotation.typeAnnotation;
        const concreteType = getWidenedConcreteType(declaredType);
        if (!concreteType) return;

        const scope = context.sourceCode.getScope(node);
        const variable = scope.variables.find((v) => v.name === id.name);
        if (!variable) return;

        const otherWrites = variable.references.filter(
          (ref) => ref.identifier !== id && ref.isWrite(),
        );
        if (otherWrites.length > 0) return;

        const concreteTypeText = context.sourceCode.getText(concreteType);
        const widenedTypeText = context.sourceCode.getText(declaredType);
        const nullishPart =
          declaredType.type === AST_NODE_TYPES.TSUnionType
            ? declaredType.types
                .filter(isNullishKeyword)
                .map((member) => context.sourceCode.getText(member))
                .join(" | ")
            : "";

        for (const ref of variable.references) {
          if (ref.identifier === id || ref.isWrite()) continue;

          const identifier = ref.identifier as TSESTree.Node & {
            parent?: TSESTree.Node;
          };
          const parent = identifier.parent;
          if (!parent) continue;

          if (
            parent.type === AST_NODE_TYPES.TSNonNullExpression &&
            parent.expression === identifier
          ) {
            context.report({
              node: parent,
              messageId: "widenThenAssert",
              data: {
                name: id.name,
                widenedType: widenedTypeText,
                concreteType: concreteTypeText,
                nullishPart,
              },
            });
            continue;
          }

          if (
            isTypeAssertionExpression(parent) &&
            parent.expression === identifier &&
            context.sourceCode.getText(parent.typeAnnotation) ===
              concreteTypeText
          ) {
            context.report({
              node: parent,
              messageId: "widenThenAssert",
              data: {
                name: id.name,
                widenedType: widenedTypeText,
                concreteType: concreteTypeText,
                nullishPart,
              },
            });
          }
        }
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Do not declare a variable's type wider than its known value, then assert it back to the narrow type",
};
