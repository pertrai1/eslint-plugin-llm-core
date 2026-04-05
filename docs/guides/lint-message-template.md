# Lint Message Template

Use this template for agent-facing rule messages when the goal is fast, low-inference repair.

## Template

```text
<What is wrong, in one direct sentence.>

Why: <One short line explaining the consequence of leaving it as-is.>

How to fix:
  Before: <The local pattern that triggered the rule.>
  After:  <The smallest safe rewrite that satisfies the rule.>
```

If one rewrite is not enough, keep the options tightly bounded:

```text
How to fix:
  Choose one explicit outcome:
  After: <Option 1>
  After: <Option 2>
```

## Rules

1. Keep the `Why:` section to one short line.
2. Prefer `Before:` and `After:` over numbered prose steps.
3. Show the smallest local rewrite that would fix the violation.
4. Use one canonical rewrite unless the AST shape truly allows multiple intents.
5. When multiple intents are plausible, present at most 2-3 explicit outcomes.
6. Do not teach a fact the type system or runtime does not support.

## When To Use A Broader Message

Some structural rules do not have a single mechanical rewrite. In those cases:

1. Keep the violation and rationale concise.
2. Anchor the fix in one concrete example.
3. Bias toward incremental extraction, not broad refactor advice.
