import { createRule } from "../utils/create-rule";

type MessageIds =
  | "redundantBooleanComparison"
  | "redundantBooleanComparisonSuggest"
  | "unnecessaryElse"
  | "unnecessaryElseSuggest"
  | "ternaryBooleanLiteral"
  | "ternaryBooleanLiteralSuggest"
  | "ifElseBooleanLiteral"
  | "ifElseBooleanLiteralSuggest";

export default createRule<[], MessageIds>({
  name: "no-redundant-logic",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow redundant boolean logic and unnecessary control flow patterns",
    },
    messages: {
      redundantBooleanComparison: [
        "Redundant comparison to boolean literal — compare directly to the value.",
        "",
        "Why: Comparing a boolean expression to `true` or `false` is redundant.",
        "The expression already evaluates to a boolean, so the comparison adds noise",
        "without changing the semantics.",
        "",
        "How to fix:",
        "  Before: if (isActive === true) { }",
        "  After:  if (isActive) { }",
        "",
        "  Before: if (isValid !== true) { }",
        "  After:  if (!isValid) { }",
        "",
        "  Before: if (hasPermission === false) { }",
        "  After:  if (!hasPermission) { }",
      ].join("\n"),
      redundantBooleanComparisonSuggest: "Remove redundant boolean comparison",
      unnecessaryElse: [
        "Unnecessary `else` — the preceding `if` block always exits.",
        "",
        "Why: When an `if` block ends with `return` or `throw`, the `else` branch",
        "is unreachable via fall-through. Keeping the `else` adds nesting without",
        "benefit and obscures the control flow.",
        "",
        "How to fix:",
        "  Before: if (status === 'active') {",
        "            return 'Active';",
        "          } else {",
        "            return 'Inactive';",
        "          }",
        "  After:  if (status === 'active') {",
        "            return 'Active';",
        "          }",
        "          return 'Inactive';",
      ].join("\n"),
      unnecessaryElseSuggest: "Remove unnecessary else block",
      ternaryBooleanLiteral: [
        "Ternary expression returning boolean literals — simplify to the condition itself.",
        "",
        "Why: `condition ? true : false` is identical to `condition` (or `!condition`).",
        "The ternary adds visual noise without changing the value.",
        "",
        "How to fix:",
        "  Before: const isEligible = age >= 18 ? true : false;",
        "  After:  const isEligible = age >= 18;",
        "",
        "  Before: const isBlocked = isAdmin ? false : true;",
        "  After:  const isBlocked = !isAdmin;",
      ].join("\n"),
      ternaryBooleanLiteralSuggest:
        "Replace ternary with direct boolean expression",
      ifElseBooleanLiteral: [
        "If/else block exclusively returns or assigns boolean literals — simplify.",
        "",
        "Why: When both branches of an if/else only return or assign `true`/`false`,",
        "the entire construct can be replaced with the condition expression directly.",
        "",
        "How to fix:",
        "  Before: if (items.length > 0) {",
        "            return true;",
        "          } else {",
        "            return false;",
        "          }",
        "  After:  return items.length > 0;",
        "",
        "  Before: if (age >= 18) {",
        "            isValid = true;",
        "          } else {",
        "            isValid = false;",
        "          }",
        "  After:  isValid = age >= 18;",
      ].join("\n"),
      ifElseBooleanLiteralSuggest:
        "Replace if/else with direct boolean expression",
    },
    schema: [],
  },
  defaultOptions: [],
  create() {
    // Stub — patterns are implemented incrementally
    return {};
  },
});
