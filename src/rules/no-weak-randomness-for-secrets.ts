import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type Options = [
  {
    sensitiveNamePattern?: string;
    allowMathRandomForNonSensitiveNames?: boolean;
    checkFunctionReturnNames?: boolean;
  },
];

type MessageIds = "weakRandomnessForSecret";

type NormalizedOptions = Required<Options[0]> & {
  sensitiveNameMatcher: RegExp;
};

const defaultSensitiveNamePattern =
  "(token|secret|password|sessionId|apiKey|nonce|salt|resetCode|verificationCode|authCode|credential)";

const defaultOptions: Options = [
  {
    sensitiveNamePattern: defaultSensitiveNamePattern,
    allowMathRandomForNonSensitiveNames: true,
    checkFunctionReturnNames: true,
  },
];

function normalizeOptions(options: Options[0] | undefined): NormalizedOptions {
  const sensitiveNamePattern =
    options?.sensitiveNamePattern ?? defaultSensitiveNamePattern;

  return {
    sensitiveNamePattern,
    allowMathRandomForNonSensitiveNames:
      options?.allowMathRandomForNonSensitiveNames ?? true,
    checkFunctionReturnNames: options?.checkFunctionReturnNames ?? true,
    sensitiveNameMatcher: createSensitiveNameMatcher(sensitiveNamePattern),
  };
}

function createSensitiveNameMatcher(pattern: string): RegExp {
  try {
    return new RegExp(pattern, "i");
  } catch {
    return new RegExp(defaultSensitiveNamePattern, "i");
  }
}

function unwrapTransparentExpression(node: TSESTree.Node): TSESTree.Node {
  let current = node;

  while (
    current.type === AST_NODE_TYPES.ChainExpression ||
    current.type === AST_NODE_TYPES.TSAsExpression ||
    current.type === AST_NODE_TYPES.TSNonNullExpression ||
    current.type === AST_NODE_TYPES.TSSatisfiesExpression ||
    current.type === AST_NODE_TYPES.TSTypeAssertion
  ) {
    current = current.expression;
  }

  return current;
}

function getStaticPropertyName(
  member: TSESTree.MemberExpression,
): string | null {
  if (!member.computed && member.property.type === AST_NODE_TYPES.Identifier) {
    return member.property.name;
  }

  if (
    member.computed &&
    member.property.type === AST_NODE_TYPES.Literal &&
    typeof member.property.value === "string"
  ) {
    return member.property.value;
  }

  return null;
}

function getPropertyKeyName(property: TSESTree.Property): string | null {
  if (!property.computed && property.key.type === AST_NODE_TYPES.Identifier) {
    return property.key.name;
  }

  if (
    property.key.type === AST_NODE_TYPES.Literal &&
    typeof property.key.value === "string"
  ) {
    return property.key.value;
  }

  return null;
}

function isSensitiveName(
  name: string | null | undefined,
  options: NormalizedOptions,
): boolean {
  return Boolean(name && options.sensitiveNameMatcher.test(name));
}

function isMemberCall(
  node: TSESTree.CallExpression,
  objectName: string,
  propertyName: string,
): boolean {
  const callee = unwrapTransparentExpression(node.callee);
  if (callee.type !== AST_NODE_TYPES.MemberExpression) return false;

  const object = unwrapTransparentExpression(callee.object);
  return (
    object.type === AST_NODE_TYPES.Identifier &&
    object.name === objectName &&
    getStaticPropertyName(callee) === propertyName
  );
}

function isMathRandomCall(node: TSESTree.Node): boolean {
  return (
    node.type === AST_NODE_TYPES.CallExpression &&
    isMemberCall(node, "Math", "random")
  );
}

function isDateNowCall(node: TSESTree.Node): boolean {
  return (
    node.type === AST_NODE_TYPES.CallExpression &&
    isMemberCall(node, "Date", "now")
  );
}

function isNewDateGetTimeCall(node: TSESTree.Node): boolean {
  if (node.type !== AST_NODE_TYPES.CallExpression) return false;

  const callee = unwrapTransparentExpression(node.callee);
  if (callee.type !== AST_NODE_TYPES.MemberExpression) return false;
  if (getStaticPropertyName(callee) !== "getTime") return false;

  const object = unwrapTransparentExpression(callee.object);
  return (
    object.type === AST_NODE_TYPES.NewExpression &&
    object.callee.type === AST_NODE_TYPES.Identifier &&
    object.callee.name === "Date"
  );
}

function isObviousCounter(node: TSESTree.Node): boolean {
  return (
    (node.type === AST_NODE_TYPES.UpdateExpression &&
      node.argument.type === AST_NODE_TYPES.Identifier) ||
    (node.type === AST_NODE_TYPES.Identifier &&
      /^(counter|sequence|seq|serial)$/i.test(node.name))
  );
}

function isWeakSource(node: TSESTree.Node): boolean {
  return (
    isMathRandomCall(node) ||
    isDateNowCall(node) ||
    isNewDateGetTimeCall(node) ||
    isObviousCounter(node)
  );
}

function isReportableWeakSource(
  node: TSESTree.Node,
  targetIsSensitive: boolean,
  options: NormalizedOptions,
): boolean {
  if (targetIsSensitive) return isWeakSource(node);

  return !options.allowMathRandomForNonSensitiveNames && isMathRandomCall(node);
}

function nodeContainsReportableWeakSource(
  node: TSESTree.Node | null | undefined,
  targetIsSensitive: boolean,
  options: NormalizedOptions,
): boolean {
  if (!node) return false;

  const current = unwrapTransparentExpression(node);
  if (isReportableWeakSource(current, targetIsSensitive, options)) return true;

  for (const [key, value] of Object.entries(current)) {
    if (
      key === "parent" ||
      key === "loc" ||
      key === "range" ||
      key === "tokens" ||
      key === "comments"
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      if (
        value.some(
          (child) =>
            isNodeLike(child) &&
            nodeContainsReportableWeakSource(child, targetIsSensitive, options),
        )
      ) {
        return true;
      }
      continue;
    }

    if (
      isNodeLike(value) &&
      nodeContainsReportableWeakSource(value, targetIsSensitive, options)
    ) {
      return true;
    }
  }

  return false;
}

function isNodeLike(value: unknown): value is TSESTree.Node {
  return (
    value !== null &&
    typeof value === "object" &&
    "type" in value &&
    typeof (value as { type?: unknown }).type === "string"
  );
}

function getAssignmentTargetName(left: TSESTree.Node): string | null {
  const target = unwrapTransparentExpression(left);

  if (target.type === AST_NODE_TYPES.Identifier) return target.name;

  if (target.type === AST_NODE_TYPES.MemberExpression) {
    return getStaticPropertyName(target);
  }

  return null;
}

function returnContainsWeakSource(
  statement: TSESTree.Statement,
  options: NormalizedOptions,
): boolean {
  if (statement.type === AST_NODE_TYPES.ReturnStatement) {
    return nodeContainsReportableWeakSource(statement.argument, true, options);
  }

  if (statement.type === AST_NODE_TYPES.BlockStatement) {
    return statement.body.some((child) =>
      returnContainsWeakSource(child, options),
    );
  }

  if (statement.type === AST_NODE_TYPES.IfStatement) {
    return (
      returnContainsWeakSource(statement.consequent, options) ||
      Boolean(
        statement.alternate &&
        returnContainsWeakSource(statement.alternate, options),
      )
    );
  }

  return false;
}

export default createRule<Options, MessageIds>({
  name: "no-weak-randomness-for-secrets",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow weak or predictable randomness when creating security-sensitive values",
    },
    messages: {
      weakRandomnessForSecret: [
        "Use cryptographic randomness for security-sensitive values.",
        "",
        "Why: Math.random(), timestamps, and counters are predictable. LLM-generated token or reset-code helpers often look unique but are guessable enough to compromise sessions, password resets, API keys, or nonces.",
        "",
        "How to fix:",
        '  Node: use crypto.randomBytes(32).toString("hex") or crypto.randomUUID().',
        "  Browser: use crypto.getRandomValues() and encode the bytes.",
      ].join("\n"),
    },
    schema: [
      {
        type: "object",
        properties: {
          sensitiveNamePattern: { type: "string" },
          allowMathRandomForNonSensitiveNames: { type: "boolean" },
          checkFunctionReturnNames: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions,
  create(context) {
    const options = normalizeOptions(context.options[0]);

    function reportIfWeak(
      node: TSESTree.Node,
      targetName: string | null,
      value: TSESTree.Node | null | undefined,
    ): void {
      const targetIsSensitive = isSensitiveName(targetName, options);
      if (!targetIsSensitive && options.allowMathRandomForNonSensitiveNames) {
        return;
      }

      if (nodeContainsReportableWeakSource(value, targetIsSensitive, options)) {
        context.report({ node, messageId: "weakRandomnessForSecret" });
      }
    }

    return {
      VariableDeclarator(node: TSESTree.VariableDeclarator) {
        if (node.id.type !== AST_NODE_TYPES.Identifier) return;
        reportIfWeak(node.id, node.id.name, node.init);
      },

      AssignmentExpression(node: TSESTree.AssignmentExpression) {
        reportIfWeak(node.left, getAssignmentTargetName(node.left), node.right);
      },

      Property(node: TSESTree.Property) {
        if (node.parent.type !== AST_NODE_TYPES.ObjectExpression) return;
        reportIfWeak(node.key, getPropertyKeyName(node), node.value);
      },

      FunctionDeclaration(node: TSESTree.FunctionDeclaration) {
        if (!options.checkFunctionReturnNames) return;
        const functionName = node.id?.name ?? null;
        if (!isSensitiveName(functionName, options)) {
          return;
        }

        if (
          node.body.body.some((statement) =>
            returnContainsWeakSource(statement, options),
          )
        ) {
          context.report({
            node: node.id ?? node,
            messageId: "weakRandomnessForSecret",
          });
        }
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Use cryptographic randomness for tokens, secrets, sessions, nonces, salts, reset codes, API keys, and credentials",
};
