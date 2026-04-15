# Error Memory Directive

## MANDATORY: Document Repeated Mistakes in ERRORS.md

LLM agents are stateless. Without persistent error memory, they will re-make
the same mistakes across sessions — the same wrong assumptions, the same
incorrect patterns, the same missed edge cases. This directive breaks that
loop.

---

## When to Write an Error Entry

Write an error entry when ALL of the following are true:

1. The agent made a mistake that reached a commit, PR, or significant draft
2. A human corrected it, or the agent caught it during VERIFY/GATES
3. The mistake is likely to recur in future sessions (not a one-off typo)
4. The prevention strategy is non-obvious — a future agent wouldn't
   automatically avoid it

**The test:** "Would a fresh agent in a new session make this same mistake?"

If yes, write the entry. If no (obvious bug, one-off slip), skip it.

---

## When NOT to Write an Error Entry

Do NOT write an error entry for:

- Mistakes already caught by existing ESLint rules or CI checks
- One-off typos or copy-paste errors
- Mistakes mandated by unclear requirements (the requirements were the problem)
- Anything a type checker would catch on its own
- Mistakes the agent self-corrected before committing (no recurrence risk)

---

## File Location and Format

```
docs/ERRORS.md
```

Single file, not per-error files. Errors are cheap to scan in bulk and the file
stays small (entries get retired as they're automated away).

### Structure of an Entry

Each entry in `docs/ERRORS.md` contains these fields:

- **Error: [Short descriptive name]** — the pattern, not the agent
- **Frequency**: N occurrences — triggers automation at 5+
- **Severity**: High | Medium | Low — production impact
- **Last Occurrence**: YYYY-MM-DD — recency signal
- **Symptom**: What you see when the error manifests
- **Bad Pattern**: The actual mistake (concrete code, not abstract description)
- **Correct Pattern**: The right way (also concrete code)
- **Prevention**: Actionable steps (e.g., "Enable X rule", "Check Y before Z")

Example entry:

    ## Error: Missing await on Promises

    **Frequency**: 12 occurrences | **Severity**: High | **Last Occurrence**: 2026-01-20

    **Symptom**: UnhandledPromiseRejectionWarning; function returns Promise instead of value

    **Bad Pattern**: `const user = getUserById(id); console.log(user.email)`

    **Correct Pattern**: `const user = await getUserById(id); console.log(user.email)`

    **Prevention**: 1. Enable @typescript-eslint/no-floating-promises 2. Add pre-commit hook

    ---

### Field Definitions

| Field               | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| **Frequency**       | Times this error has occurred. Triggers automation at 5+.    |
| **Severity**        | How bad it is when it happens. High = production impact.     |
| **Last Occurrence** | Recency signal. Helps prioritize during monthly review.      |
| **Symptom**         | How to recognize the error (for the agent and humans).       |
| **Bad Pattern**     | The actual mistake. Concrete code, not abstract description. |
| **Correct Pattern** | The right way. Also concrete code.                           |
| **Prevention**      | Actionable steps. Not "be more careful" — specific guards.   |

---

## When to Read ERRORS.md

**During the Anchor phase of CODEBASE_NAVIGATION**, after loading types and
test names, load relevant error entries for the domain you're working in.

Do not load the entire file. Use progressive disclosure:

```bash
# Load only errors relevant to your task domain
grep -A 20 "## Error:" docs/ERRORS.md | grep -B 2 -A 18 "async\|promise\|null\|<your-domain-keyword>"
```

**Before implementation starts** (after ORIENT, before TYPES), the agent
should have relevant error patterns in context. This is the "don't do these
things" layer that complements the "do it this way" layer from types and tests.

---

## Monthly Review Process

Each month, the first agent session after the 1st should check the review date
in `docs/ERRORS.md`. If the last review is 30+ days old, run the review:

1. **Sort by frequency** — highest-count errors first
2. **Errors at 5+ occurrences**: Automate the prevention
   - Can an ESLint rule catch it? → Create one (this is our product)
   - Can a type guard catch it? → Add one
   - Can CI catch it? → Add a check
3. **Errors at 1-2 occurrences with no recurrence in 30+ days**: Consider
   retiring. The agent learned, or the codebase changed.
4. **Update prevention strategies** — if a new rule or check was added,
   note it in the entry

**The goal isn't zero errors. It's zero repeated errors.**

### Retirement

When an error is fully automated (ESLint rule exists, CI catches it), mark it:

    ## Error: [name] (RETIRED)

    **Retired**: YYYY-MM-DD
    **Automated by**: `no-floating-promise` rule (v1.2.0)

Retired entries stay in the file for reference but are skipped during the
Anchor phase.

---

## Connection to Other Directives

```
CODEBASE_NAVIGATION.md          ← loads error entries during Anchor phase
SESSION_DECISIONS.md            ← captures why choices were made (not mistakes)
VERIFICATION.md                 ← catches errors before merge (not memory)
ERRORS.md (this directive)      ← remembers mistakes to prevent recurrence
```

### Compacting Pipeline Integration

During the compact step (every 5+ tasks per CODEBASE_NAVIGATION.md), check:

```
Compacting checklist (extended):
  □ Session digest (current context)
  □ Pending work and active constraints
  □ Decision logs for qualifying decisions
  □ Error entries for qualifying mistakes ← NEW
  □ Discard exploration context
```

If a task produced a corrected mistake that meets the error entry criteria,
write it during compacting while the details are fresh.

---

_This directive ensures mistakes compound into guardrails instead of repeating._
