# Session Decisions Directive

## MANDATORY: Capture Durable Decisions at Task Completion

Before closing out any task where you set or changed a durable repo/process
policy, architectural constraint, or cross-cutting code/documentation
convention, you MUST write a decision log entry if the reasoning would not be
obvious later. This is non-negotiable.

---

## When to Write a Decision Log

Write a decision log when ALL of the following are true:

1. You set, changed, or explicitly confirmed a durable decision that affects repo policy, contributor workflow, architecture, or a cross-cutting convention
2. You made a choice between two or more real alternatives
3. The rejected alternatives were plausible (a reasonable agent might have chosen them)
4. The reason for your choice is not obvious from the code, config, or document diff alone, and a future agent would likely spend real time re-deciding or accidentally reversing it without a log

**The test:** Ask yourself:

- "Will this decision still matter outside the file I changed?"
- "Would another reasonable agent revisit this tradeoff without extra context?"

If both are yes, write the log. If any of the criteria above are false, no log
is needed.

---

## When NOT to Write a Decision Log

Do NOT write a decision log for:

- Choices mandated by a directive (e.g., using TDD, defining types first, following naming conventions)
- Naming choices where no alternatives were explicitly considered
- Standard library usage over custom code (always prefer standard — not a decision)
- Bug fixes (the decision is obvious: fix it correctly)
- Routine implementation details where the code clearly explains itself
- Single-file or one-off refactors that do not establish an ongoing convention
- Local code-level choices that do not affect future work elsewhere in the repo

Most code-level decisions do **not** need a log. Code decisions qualify only
when they create a reusable rule for later work, such as an architectural
boundary, an authoring convention, or a cross-cutting policy.

---

## When to Read Existing Decision Logs

Before changing repo policy, contributor workflow, architecture, rule-authoring
conventions, lint-message format, or any other cross-cutting behavior:

1. Scan the frontmatter in `docs/decisions/*.md`
2. Filter for entries with `status: active`
3. Match on `domain`, `triggers`, and `applies_to`
4. Open only the matching logs unless you need a superseded record for history

Decision logs are for progressive disclosure. Do not load every file in
`docs/decisions/` by default.

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

## Frontmatter

Every decision log MUST begin with YAML frontmatter so agents can classify and
retrieve the right records before reading the full body.

```yaml
---
date: YYYY-MM-DD
task: one-line task description
domain: short-kebab-case-decision-domain
kind: repo-policy | process | architecture | code-convention
scope: repo | cross-cutting | subtree
status: active | superseded | retired
triggers:
  - when this record should be read
applies_to:
  - path/or/glob
supersedes: []
---
```

### Required Fields

| Field        | Purpose                                                                  |
| ------------ | ------------------------------------------------------------------------ |
| `date`       | The date the decision was recorded                                       |
| `task`       | The task this decision arose from                                        |
| `domain`     | Stable retrieval key for the decision area                               |
| `kind`       | Broad class of decision                                                  |
| `scope`      | Whether the decision applies repo-wide, cross-cuttingly, or to a subtree |
| `status`     | Whether the decision is current                                          |
| `triggers`   | Short phrases describing when agents should read this log                |
| `applies_to` | Paths or globs affected by the decision                                  |
| `supersedes` | Older decision records replaced by this one                              |

Keep frontmatter short and operational. If a field does not help an agent decide
whether to read the file, it does not belong here.

`SESSION_DECISIONS.md` is the canonical source for the retrieval workflow and
frontmatter schema. Other docs should link here instead of duplicating the full
rules.

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

| Question                                                                                      | Answer                                                              |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Does this set repo policy, workflow, architecture, or a cross-cutting convention?             | If no → skip the log                                                |
| Did I choose between plausible alternatives?                                                  | If no → skip the log                                                |
| Is the reasoning obvious from the diff, and would a future agent avoid re-deciding it anyway? | If yes → skip the log                                               |
| Before making a cross-cutting change, what do I do first?                                     | Scan decision-log frontmatter and read only matching active entries |
| Where does the file go?                                                                       | `docs/decisions/YYYY-MM-DD-<topic>.md`                              |
| What template?                                                                                | [`docs/decisions/TEMPLATE.md`](../../docs/decisions/TEMPLATE.md)    |
