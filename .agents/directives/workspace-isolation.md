---
name: workspace-isolation
description: Keeps mutable work in an isolated workspace by detecting existing isolation first, preferring native tools, and falling back to git worktrees only when needed.
version: 1.0.0
required: false
category: workflow
tools:
  - claude
  - codex
triggers:
  - isolated-workspace
  - worktree
  - branch-isolation
  - feature-work
routing:
  load: conditional
  applies_to:
    - implementation
    - debugging
---

# Workspace Isolation Directive

**When to load:** Load this directive before implementation or invasive debugging
when the task will mutate a git-backed repository and the current workspace may be
shared, protected, dirty, or otherwise not isolated.

The goal is simple: protect the current workspace from task-specific edits unless
there is a good reason to work in place. Detect existing isolation first. Prefer
native workspace tools when the platform provides them. Use `git worktree` only
as a fallback.

---

## Core Rules

1. **Detect before creating.** Confirm whether the current checkout is already an
   isolated workspace before creating anything.
2. **Prefer native tools.** If the platform already manages isolated workspaces,
   use that tool instead of manual `git worktree` commands.
3. **Ask before creating a new workspace when preference is unknown.** If the
   user has not already asked for isolation and project instructions do not
   declare a preference, ask for consent before creating a new workspace.
4. **Treat protected or shared checkouts as isolation candidates.** If the agent
   is on `main`, `master`, `trunk`, another protected/default branch, or a
   checkout with unrelated local changes, prefer isolation rather than editing in
   place.
5. **Baseline after isolation.** Setup and baseline verification belong in the
   workspace where the task will actually run.

---

## Step 0: Detect Existing Isolation

Before creating anything, determine whether the current checkout is already an
isolated workspace:

```bash
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
  echo "Repository is not git-backed; workspace-isolation directive does not apply."
  exit 0
}

GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

If `GIT_DIR != GIT_COMMON`, you may already be in a linked worktree. Guard
against submodules before concluding that:

```bash
git rev-parse --show-superproject-working-tree 2>/dev/null
```

If the command returns empty output, the checkout is **not** a submodule. If it
returns a path, the checkout **is** a submodule of that superproject and should
be treated as a normal checkout for this directive rather than as an already
isolated worktree.

- If `GIT_DIR != GIT_COMMON` **and** the checkout is not a submodule, treat the
  current location as already isolated. Do not create another worktree.
- If `GIT_DIR == GIT_COMMON`, you are in the main checkout and should evaluate
  whether a separate workspace is warranted.
- If the repository is not git-backed, this directive does not apply; state that
  clearly and continue with the routed workflow.

Report the result before moving on:

- On a branch: `Already in isolated workspace at <path> on branch <name>.`
- Detached HEAD: `Already in isolated workspace at <path> (detached HEAD; branch creation may be needed later).`
- Normal checkout: `Current checkout is not isolated; deciding whether to create one before editing.`

---

## Step 1: Choose the Isolation Mechanism

### 1a. Native Workspace Tools (preferred)

If the platform already provides a native worktree/workspace mechanism, use it.
Native tools often manage placement, naming, cleanup, and integration better than
manual git commands.

Do **not** bypass a native isolation tool with `git worktree add` unless the
platform explicitly requires the git fallback.

### 1b. Git Worktree Fallback

Use `git worktree` only when no native workspace tool is available.

#### Directory selection

Use this priority order:

1. An explicit user or project-instruction preference
2. An existing project-local `.worktrees/`
3. An existing project-local `worktrees/`
4. An outside-repo worktree location
5. A new project-local `.worktrees/` only when it is already ignored or the user explicitly approves changing ignore rules

#### Ignore verification

For project-local worktree directories, verify the directory is ignored before
creating the worktree. Check the directory you actually selected in the previous
step:

```bash
git check-ignore -q "$CHOSEN_DIR" 2>/dev/null
```

If the chosen directory is not ignored, do **not** silently modify tracked repo
files before isolation. Prefer an already-ignored directory, add an untracked
rule in `.git/info/exclude`, or use an outside-repo location. Ask for explicit
user consent before changing `.gitignore`.

#### Create the worktree

```bash
git worktree add "<path>" -b "<branch-name>"
cd "<path>"
```

If worktree creation fails because the environment blocks it (for example,
permission or sandbox restrictions), say so explicitly and continue in place only
with a documented fallback.

---

## Step 2: Project Setup in the Chosen Workspace

Run the project's documented setup commands in the workspace where the task will
execute. Prefer project instructions over generic ecosystem guesses.

Minimum expectations:

- Ensure the branch/workspace is the one you plan to edit
- Run only the setup commands needed to make that workspace ready
- Re-check `git status --short` so the baseline is understood in the actual work area

---

## Step 3: Baseline Proof Before Editing

Before implementation starts, show that the chosen workspace is ready:

- What workspace/path is active
- What branch is active
- Whether the workspace began clean or had pre-existing changes
- Which baseline command(s) were run for this repository

If baseline tests or checks fail, report that and ask whether to proceed. Do not
silently treat a broken baseline as acceptable.

---

## Step 4: Proceed or Fall Back

Once isolation and baseline are established:

- Proceed with the routed workflow in the isolated workspace, or
- State the fallback clearly if you must work in place

Fallbacks are acceptable only when:

- the user explicitly prefers in-place work,
- the repository is not git-backed,
- a native or git-based isolation mechanism is unavailable, or
- the environment blocks workspace creation and the user still wants work to continue

---

## Forbidden Patterns

| Pattern                                                                                   | Why Forbidden                                        |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Creating a new worktree without checking whether one already exists                       | Risks nested or duplicate workspaces                 |
| Using `git worktree add` when a native workspace tool is available                        | Fights the platform/harness                          |
| Editing a protected/default branch or dirty shared checkout without considering isolation | Needlessly risks unrelated work                      |
| Creating a project-local worktree directory without ignore verification                   | Pollutes repo status and can leak files into commits |
| Running setup or baseline in one checkout, then editing a different one                   | Evidence no longer matches reality                   |
| Treating environment failures as silent permission to continue                            | Hides risk and makes later debugging harder          |

---

## Quick Reference

| Situation                                       | Action                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| Already in a linked worktree                    | Reuse it; do not create another                                  |
| In a normal checkout on a shared/default branch | Prefer isolation before editing                                  |
| User already asked for isolation                | Create or enter the isolated workspace without re-asking         |
| Preference unknown                              | Ask before creating a new workspace                              |
| Native workspace tool exists                    | Use it before git fallback                                       |
| No native tool exists                           | Use `git worktree` with ignore verification                      |
| Worktree creation is blocked                    | State the fallback and continue only with explicit justification |
| Baseline is failing                             | Report it and get direction before proceeding                    |

_This directive complements adaptive routing: the router decides **when** isolation
matters, and this directive governs **how** to establish it safely._
