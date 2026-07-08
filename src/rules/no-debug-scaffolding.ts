import { AST_NODE_TYPES, TSESLint, TSESTree } from "@typescript-eslint/utils";
import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type MessageIds = "debuggerStatement" | "rawConsoleDump" | "temporaryConsole";

type SourceCode = Readonly<TSESLint.SourceCode>;

const DEBUG_CONSOLE_METHODS = new Set(["debug", "log", "trace"]);

const TEMPORARY_MARKERS = [
  /^debug(?:ging)?$/iu,
  /^here$/iu,
  /^test(?:ing)?$/iu,
  /^trace$/iu,
  /^value$/iu,
  /^data$/iu,
  /^result$/iu,
  /^response$/iu,
  /\b(?:todo|fixme|remove|temporary|temp|debug|console\.log)\b/iu,
];

function isReferenceToGlobal(
  sourceCode: SourceCode,
  id: TSESTree.Identifier,
): boolean {
  let scope: TSESLint.Scope.Scope | null = sourceCode.getScope(id);

  while (scope) {
    const variable = scope.variables.find(({ name }) => name === id.name);

    if (variable) {
      return variable.defs.length === 0;
    }

    scope = scope.upper;
  }

  return true;
}

function isGlobalConsoleDebugMethod(
  sourceCode: SourceCode,
  node: TSESTree.Node,
): node is TSESTree.MemberExpression {
  return (
    node.type === AST_NODE_TYPES.MemberExpression &&
    !node.computed &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    node.object.name === "console" &&
    isReferenceToGlobal(sourceCode, node.object) &&
    node.property.type === AST_NODE_TYPES.Identifier &&
    DEBUG_CONSOLE_METHODS.has(node.property.name)
  );
}

function getStaticString(node: TSESTree.Node): string | null {
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === "string") {
    return node.value;
  }

  if (
    node.type === AST_NODE_TYPES.TemplateLiteral &&
    node.expressions.length === 0
  ) {
    return node.quasis.map((quasi) => quasi.value.cooked ?? "").join("");
  }

  return null;
}

function isTemporaryMarker(text: string): boolean {
  const normalized = text.trim();
  return TEMPORARY_MARKERS.some((pattern) => pattern.test(normalized));
}

function isRawDumpArgument(node: TSESTree.Node): boolean {
  return (
    node.type === AST_NODE_TYPES.Identifier ||
    node.type === AST_NODE_TYPES.MemberExpression ||
    node.type === AST_NODE_TYPES.CallExpression ||
    node.type === AST_NODE_TYPES.ObjectExpression ||
    node.type === AST_NODE_TYPES.ArrayExpression
  );
}

export default createRule<[], MessageIds>({
  name: "no-debug-scaffolding",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow temporary debugger statements and console debug scaffolding left behind during development",
    },
    messages: {
      debuggerStatement: [
        "Remove this `debugger` statement before committing.",
        "",
        "Why: `debugger` pauses execution in developer tools and is almost always temporary scaffolding.",
        "LLMs often leave it behind after troubleshooting, which can break production or test flows.",
        "",
        "How to fix:",
        "  Delete it, or replace it with intentional error handling or structured logging if runtime visibility is required.",
      ].join("\n"),
      temporaryConsole: [
        "Remove temporary console debug scaffolding (`{{ call }}`).",
        "",
        "Why: Ad-hoc console probes such as `debug`, `here`, `TODO remove`, or empty console calls are LLM/debug-session residue.",
        "They add noise without becoming intentional observability.",
        "",
        "How to fix:",
        "  Delete the probe. If this is real runtime telemetry, use the project's logger with a stable message and structured metadata.",
      ].join("\n"),
      rawConsoleDump: [
        "Avoid raw console dumps (`{{ call }}`); use structured logging or remove the debug probe.",
        "",
        "Why: Dumping identifiers, objects, or function results is temporary debugging scaffolding.",
        "It often exposes noisy or sensitive data and is hard to search, filter, or maintain.",
        "",
        "How to fix:",
        "  Delete the dump, or replace it with a deliberate log message plus structured metadata.",
      ].join("\n"),
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      DebuggerStatement(node) {
        context.report({
          node,
          messageId: "debuggerStatement",
        });
      },
      CallExpression(node: TSESTree.CallExpression) {
        if (!isGlobalConsoleDebugMethod(sourceCode, node.callee)) {
          return;
        }

        const call = sourceCode.getText(node.callee);
        const [firstArg] = node.arguments;
        if (!firstArg || firstArg.type === AST_NODE_TYPES.SpreadElement) {
          context.report({
            node,
            messageId: "temporaryConsole",
            data: { call },
          });
          return;
        }

        const staticText = getStaticString(firstArg);
        if (staticText !== null) {
          if (isTemporaryMarker(staticText)) {
            context.report({
              node,
              messageId: "temporaryConsole",
              data: { call },
            });
          }
          return;
        }

        if (isRawDumpArgument(firstArg)) {
          context.report({
            node,
            messageId: "rawConsoleDump",
            data: { call },
          });
        }
      },
    };
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Do not leave debugger statements or temporary console debug probes in committed code; delete them or convert intentional telemetry to structured logging",
};
