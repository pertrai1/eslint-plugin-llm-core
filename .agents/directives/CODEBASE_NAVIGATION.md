---
name: codebase-navigation
description: Guides progressive codebase orientation with the SAFE pattern before implementation, review, or unfamiliar work.
version: 1.0.0
triggers:
  - orientation
  - unfamiliar-codebase
  - multi-step-work
routing:
  load: conditional
---

# Codebase Navigation Directive

**When to load:** Load this directive for unfamiliar codebases or new multi-task sessions unless adaptive routing determines the task is purely conversational, docs-only, or the agent is already oriented.

This directive governs how the agent explores and reads the codebase before
starting repo-based implementation or review work. Adaptive routing may skip it
for purely conversational, docs-only, or already-oriented tasks.

**Do not skip orientation.** Starting work without surveying the codebase produces
code that doesn't fit existing patterns, duplicates logic, or breaks imports.

---

## S — Survey

**Goal:** Understand where things live and how the project is organized.
**Token budget:** ~2,000 tokens maximum.

Read these **in order**. Stop as soon as you have enough orientation for the task.

```
1. Project-level instructions (AGENTS.md, CLAUDE.md, or equivalent)
   → project WHY, WHAT, HOW, workflow
2. tree -L 2 -I node_modules (or equivalent)
   → directory structure
   - Do NOT recurse deeply — flat or depth-2 only.
     Deep listings exceed the Survey token budget on larger repos.
3. The project's entry point — main export file, router, or public API surface
   → what's exported, what's public
4. Build/test/lint commands (package.json scripts, Makefile, or equivalent)
```

**Do NOT read at this stage:**

- Full implementation files
- Test file bodies
- Long config files
- Dependency directories (node_modules, vendor, etc.)

**What you should know after Survey:**

- Where the relevant source files live
- What the public API surface looks like
- How to build, test, and lint

---

## A — Anchor

**Goal:** Load the constraints that most strongly determine correct output.
**Token budget:** ~3,000 tokens maximum.

Anchor on **types and contracts**, not implementations.

```
1. Type definitions for the area you're working in
   - Type imports in the relevant source files (just the imports, first ~20 lines)
   - Co-located type definitions or dedicated types files

2. Test file NAMES for the area (not bodies)
   - grep "describe\|it(" tests/path/to/area-test.ts | head -30
   - Test names are specifications — they tell you what behavior exists

3. ONE reference file showing the existing pattern
   - Pick the most similar existing file to what you're working on
   - Read its exports and public interface only (skip full body)

4. Applicable directives and scoped instructions
   - Load any project-level directives or scoped instructions that apply
```

**Prefer:**

```bash
# High-information, low-token reads
head -25 path/to/representative-file.ts          # imports + exports
grep "key-pattern" path/to/representative-file.ts -A 20  # relevant metadata
grep "describe\|it(" tests/path/to/test-file.ts  # test specifications
```

**If your agent framework provides dedicated read/search tools** (e.g. Read
with line ranges, Grep, or Glob), prefer those over raw shell commands — they
are typically optimized for the agent's context management.

**Avoid:**

```bash
# Low-information, high-token reads
cat path/to/source-file.ts               # entire file — wastes context
cat tests/path/to/test-file.ts           # entire test file — wastes context
```

---

## F — Filter

**Goal:** Narrow to exactly the files your task touches.
**Token budget:** ~2,000-5,000 tokens (task-dependent).

Only now read the specific files you'll modify or that your changes depend on.

```
1. Find dependents:
   grep -rl "from.*my-module" src/ | head -10

2. Find what the target file imports:
   head -30 path/to/target-file.ts  # just the import block

3. Read the specific functions/types you need to change or extend
   - Use line-offset reads, not cat
   - Skim for structure, skip internal helpers you won't touch
```

**The dependency check prevents:**

- Breaking imports in files you didn't know depended on yours
- Duplicating logic that already exists elsewhere
- Missing required changes to consumer code

### Optional tool-assisted architecture check

If the task may change imports, exports, packages, services, shared code, or
folder boundaries, load `.agents/directives/ARCHITECTURE_BOUNDARIES.md` before Execute.

For TypeScript/JavaScript projects with Fallow available, use targeted checks
when they answer boundary questions faster than manual search:

```bash
npx fallow list --boundaries
npx fallow dead-code --boundary-violations
npx fallow dead-code --circular-deps
```

If GitNexus is available, use graph context to identify dependents, clusters,
services, and execution flows before making cross-cutting changes.

---

## E — Execute

**Goal:** Begin the standard implementation workflow with high-information context.

By this point entropy is reduced enough that first-try correctness should be
70-85%. Proceed with your project's implementation workflow.

---

## Context Discipline Rules

These rules prevent context rot during long sessions.

### 1. Read by Slice, Not by File

```bash
# Good — reads what you need
head -30 path/to/file.ts                    # imports + signature
sed -n '45,80p' path/to/file.ts             # specific section

# Bad — floods context
cat path/to/file.ts                         # entire 200-line file
```

### 2. Use grep Before cat

Before reading any file, grep for what you need. If grep answers your
question, don't read the file.

```bash
grep "export.*function\|export.*const\|export type" path/to/file.ts
grep -n "key-pattern:" path/to/file.ts
```

If your project uses AST-aware search tools (e.g., ast-grep), prefer those
over regex for structural queries — they match AST nodes, not strings, so they
won't false-positive on commented-out code, string literals, or nested scopes.

### 3. Summarize Between Tasks

After completing each task (one full cycle through the workflow), summarize
before starting the next:

- What changed (1-2 sentences)
- Any decisions affecting subsequent work
- Forget intermediate exploration — keep only current state and constraints

### 4. Compact After 5+ Tasks

If you've completed 5+ tasks in one session, pause and compact:

1. Summarize all completed work (max 500 words)
2. List current file state and pending work
3. Discard exploration context from earlier tasks
4. Write any qualifying decision logs or error entries (see below)

Without compaction, accuracy degrades roughly as follows (heuristic, not measurement):

```
Tasks 1-5:   ~90% signal
Tasks 6-10:  ~60% signal
Tasks 11+:   ~30% signal
```

**Framework-dependent action:**

- If your framework supports auto-compaction (e.g., Claude Code): trigger it now
- If not: produce a session digest as a message summarizing completed work,
  pending items, and active constraints, then continue

### 5. Compact → Session Decisions Pipeline

Compacting produces two outputs with different audiences:

**Session digest** (for the _current_ session's context window):

- What changed (1-2 sentences per task)
- Current file state and pending work
- Active constraints for remaining work
- This replaces the full history — it IS the compacted context

**Decision log** (for _future_ sessions and contributors):

- Written following session-decisions guidance
- Only when durable decisions were made (architectural, convention, policy)
- Stored in `docs/decisions/YYYY-MM-DD-<topic>.md`
- Future agents scan frontmatter to find relevant context without reading everything

The connection: when you compact, check whether any completed task included a
qualifying decision. If so, write the decision log _during compacting_ while the
reasoning is fresh — don't wait until session end.

```
Compacting checklist:
  □ Summarize completed work (session digest)
  □ List pending work and active constraints
  □ For each completed task: did it set a durable decision?
    → Yes: write docs/decisions/YYYY-MM-DD-<topic>.md now
    → No: skip
  □ Discard exploration context
```

This ensures decisions are captured when reasoning is fresh, and the session
digest keeps the current context window lean for the next task.

---

## Forbidden Patterns

| Pattern                                     | Why Forbidden                                               |
| ------------------------------------------- | ----------------------------------------------------------- |
| `cat` on any file over 50 lines             | Wastes context on low-information content                   |
| Reading a file "to get familiar"            | Familiarity comes from types and tests, not implementations |
| Skipping Survey to start coding immediately | Produces code that doesn't fit the codebase                 |
| Reading full test file bodies during Anchor | Test names are the spec; bodies are for the RED phase       |
| Loading all directives for every task       | Use progressive disclosure — load only what applies         |
| Starting a second task without compacting   | Context from task 1 rots and confuses task 2                |

---

## Quick Reference

| Phase       | Read                                         | Budget       | Know After              |
| ----------- | -------------------------------------------- | ------------ | ----------------------- |
| **Survey**  | Project instructions, tree, exports, scripts | ~2K tokens   | Where things live       |
| **Anchor**  | Types, test names, one reference, directives | ~3K tokens   | What correct looks like |
| **Filter**  | Specific files task touches, dependents      | ~2-5K tokens | What to change          |
| **Execute** | Follow project implementation workflow       | Per-step     | Correct implementation  |

---

_This directive is mandatory before any implementation, bug fix, or refactor. It ensures the agent starts work with maximum information density and minimum context waste._
