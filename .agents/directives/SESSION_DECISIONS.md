# Session Decisions Directive

## MANDATORY: Capture Non-Obvious Decisions at Task Completion

Before closing out any task where you made a non-obvious choice between
alternatives, you MUST write a decision log entry. This is non-negotiable.

---

## When to Write a Decision Log

Write a decision log when ALL of the following are true:

1. You made a choice between two or more real alternatives
2. The rejected alternatives were plausible (a reasonable agent might have chosen them)
3. The reason for your choice is not visible in the code itself

**The test:** Ask yourself — "If a future agent reads this code without any context,
would they likely reverse this decision?" If yes, write the log.

If none of the above applies, no log is needed.

---

## When NOT to Write a Decision Log

Do NOT write a decision log for:

- Choices mandated by a directive (e.g., using TDD, defining types first, following naming conventions)
- Naming choices where no alternatives were explicitly considered
- Standard library usage over custom code (always prefer standard — not a decision)
- Bug fixes (the decision is obvious: fix it correctly)
- Implementation details where the code clearly explains itself

---

## File Naming

```
docs/decisions/YYYY-MM-DD-<topic>.md
```

Use today's date with zero-padded month and day. Use a short kebab-case topic
that names the **decision domain**, not the outcome.

```
docs/decisions/2026-04-05-error-reporting-format.md     ✅ names the domain
docs/decisions/2026-04-05-chose-discriminated-unions.md ✗ names the outcome
docs/decisions/2026-04-05-refactor.md                   ✗ too vague
```

---

## Template

Copy [`docs/decisions/TEMPLATE.md`](../../docs/decisions/TEMPLATE.md), fill in
every section. Delete placeholder text. Do not leave `[brackets]` in the output.

### Required Sections

Every decision log MUST contain all five sections:

| Section                   | What it contains                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| **Title**                 | One sentence starting with a verb. Names the domain, not the outcome.                     |
| **Context**               | 2–4 sentences on the problem, constraints, and why this was a real choice.                |
| **Decision**              | One paragraph. Specific reasoning — name the properties that made this option preferable. |
| **Rejected Alternatives** | At least one entry. Name the alternative and the specific reason it was disqualified.     |
| **Consequences**          | Easier / Harder / Watch for — what this decision makes true going forward.                |

---

## Forbidden Patterns

| Pattern                                           | Why it's forbidden                            |
| ------------------------------------------------- | --------------------------------------------- |
| "We decided to use the best approach"             | Not a decision — no alternative named         |
| Leaving `[placeholder]` text in the output        | Decision log is incomplete — do not commit it |
| One-line entries                                  | If it fits in one line, it doesn't need a log |
| Logging choices already captured in code comments | Duplication — code comments are sufficient    |
| Writing the log before finishing the task         | You don't know the consequences yet           |
| Writing a log that says "no decisions were made"  | If no decisions were made, write nothing      |

---

## Rationale

LLM agents make architectural decisions silently. When a future agent picks up
the same codebase, it has no record of what was tried and rejected. It will
re-evaluate the same tradeoffs and often reach different conclusions — causing
churn, regression, or duplicated investigation.

Decision logs are the cheapest form of context transfer. A 10-line log written
now prevents a 30-minute re-investigation later.

---

## Quick Reference

| Question                                            | Answer                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| Did I choose between two or more real alternatives? | If no → skip the log                                             |
| Is the reason visible in the code?                  | If yes → skip the log                                            |
| Would a future agent likely reverse this?           | If yes → write the log                                           |
| Where does the file go?                             | `docs/decisions/YYYY-MM-DD-<topic>.md`                           |
| What template?                                      | [`docs/decisions/TEMPLATE.md`](../../docs/decisions/TEMPLATE.md) |
