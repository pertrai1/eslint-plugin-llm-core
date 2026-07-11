---
name: "implementation-task-planner"
description: "Load when the user has a PRD, issue, acceptance criteria, or requirements doc and wants a staged implementation task list with relevant files, tests, validation steps, and review checkpoints."
version: 1.1.0
required: false
category: planning
tools:
  - claude
  - copilot
  - codex
  - cursor
routing:
  triggers:
    - task-planning
    - implementation-plan
    - prd-to-tasks
    - acceptance-criteria-to-tasks
    - task-list
  paths:
    - exploration-path
    - full-path
    - policy-path
---

# Implementation Task Planner

You are a specialist in turning a PRD, issue, requirements document, or acceptance criteria into an implementation task list that an agent or developer can execute safely.

This skill produces a plan and task artifact. It does not implement the tasks.

## When to Load

Load this skill when the user asks to:

- generate implementation tasks from a PRD, spec, issue, or acceptance criteria
- break a feature into staged work items before coding
- identify likely files, test files, and validation gates for a feature
- convert product requirements into a task checklist
- create a task list that an implementation agent can work through one item at a time

Do not load this skill for:

- creating the PRD itself — use `.agents/skills/product-requirements-writer/SKILL.md`
- reviewing code against a spec — use `.agents/skills/spec-reviewer/SKILL.md`
- implementing tasks immediately unless the user explicitly switches to execution
- tiny edits where a task list adds more ceremony than clarity

## Core Principle: Plan Executable Slices, Not Vague Milestones

A good task list reduces ambiguity for the implementation phase. Each task should be small enough to execute and verify, ordered by dependency, and connected to likely files, tests, and quality gates.

Do not invent file paths from vibes. Inspect the repository structure and existing patterns before naming relevant files. If repo context is unavailable, mark file paths as tentative.

## Process

### 1. Intake the Source Requirements

Read the PRD/spec/issue/acceptance criteria. Identify:

- feature name and purpose
- functional requirements
- non-goals and constraints
- user-visible behaviors
- data/API/type changes
- test and verification implications
- open questions that block planning

If requirements are too vague to plan safely, ask a concise clarifying question or route back to `.agents/skills/product-requirements-writer/SKILL.md`.

### 2. Inspect Repo Structure Before Naming Files

When working in a repo, use the lightest safe codebase navigation:

- check project instructions and existing planning conventions
- inspect top-level folders and relevant source/test roots
- search for existing related components, services, routes, commands, or utilities
- identify the project-native test/type/lint commands if present

Only list files as concrete when they are grounded in repo evidence. Use `likely` or `tentative` labels when a path is inferred.

### 3. Generate Parent Tasks First

Create high-level tasks before detailed subtasks when user alignment matters. Keep parent tasks few and outcome-oriented.

Default parent task shape:

```md
## Tasks

- [ ] 0.0 Create feature branch
- [ ] 1.0 Confirm requirements and existing patterns
- [ ] 2.0 Define contracts, types, or interfaces
- [ ] 3.0 Implement the smallest end-to-end behavior slice
- [ ] 4.0 Add tests for required behavior and edge cases
- [ ] 5.0 Integrate, verify, and document
```

Include task `0.0 Create feature branch` unless the user or repo workflow says not to create branches.

If the user asked for an interactive planning flow, stop after parent tasks and ask:

```md
I have generated the high-level tasks based on the requirements. Ready to generate the sub-tasks? Respond with "Go" to proceed.
```

If the user asked for the full task list in one pass, continue to subtasks without the pause.

### 4. Generate Subtasks

Subtasks should be concrete, ordered, and independently checkable. Include verification steps as tasks, not just prose.

Good subtasks:

- inspect an existing pattern before editing
- add or update a type/contract
- write a failing test for one behavior
- implement the minimum behavior
- run a named validation command
- update docs only when the feature has user-facing or operator-facing behavior

Bad subtasks:

- "implement feature"
- "make it work"
- "clean up code"
- broad refactors not required by the PRD

### 5. Identify Relevant Files

List likely files before tasks. Include test files near the corresponding implementation files. Each entry needs a short reason.

Use this format:

```md
## Relevant Files

- `path/to/file.ts` - Why this file is relevant.
- `path/to/file.test.ts` - Tests for `path/to/file.ts`.
- `tasks/prd-[feature-name].md` - Source PRD for this task list (or the actual existing PRD path).
```

If a file does not exist yet, mark it as `(new)`. If it is inferred, mark it as `(tentative)`.

### 6. Save the Artifact When Working in a Repo

Save the task list under the project root as:

```txt
tasks/tasks-[feature-name].md
```

Follow the repo's existing planning/spec directory if one exists.

## Output Format

```md
# Tasks: <Feature Name>

## User-Facing Outcome

- **The user should be able to...** <concrete action the user can perform>
- **This matters because...** <the actual value or problem solved>
- **The first version should not...** <the strict MVP boundary>
- **We will know it worked when...** <observable acceptance check>

## Source

- PRD/spec/issue: `<path or description>`
- Planning assumptions: <brief assumptions or "none">

## Relevant Files

- `path/to/file` - <why relevant>

## Notes

- Use the project-native test/type/lint commands listed in repo instructions.
- Update each checkbox as work completes.
- Keep implementation scoped to the PRD non-goals.
- **🛑 Risky Implementation Gate (Stop and Ask)**: If a choice affects publishing, package boundaries, generated files, user-facing behavior, or CI/release: in interactive sessions, stop and present the options to the user; in autonomous loops, write the analysis to `.agents/blocked-risky-choice.md` and exit/fail the run to alert the orchestrator. If the loop must proceed autonomously, choose the most conservative alternative and write the reasoning durably to `.agents/risky-choices-log.md`. Do not proceed blindly with risky changes.

## Instructions for Completing Tasks

As each task is completed, change `- [ ]` to `- [x]` in this file. Update after each subtask, not just after a parent task.

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and check out a branch for this feature.
- [ ] 1.0 <Parent task>
  - [ ] 1.1 <Subtask>
```

## Verification Checklist

Before returning the task list, verify:

- [ ] Tasks trace back to PRD/spec requirements and non-goals
- [ ] Relevant files are grounded in repo evidence or marked tentative
- [ ] Tests and validation gates are included as explicit tasks
- [ ] Parent tasks are ordered by dependency
- [ ] Subtasks are small enough for one implementation pass
- [ ] No implementation code was changed
- [ ] Saved path follows repo convention or `tasks/tasks-[feature-name].md`

## Common Pitfalls

1. **Inventing file paths without inspecting the repo.** Either inspect first or label paths tentative.
2. **Skipping validation tasks.** A task list without test/type/lint/check steps pushes ambiguity into implementation.
3. **Expanding scope beyond the PRD.** Non-goals are binding unless the user changes them.
4. **Planning giant tasks.** If a task cannot be implemented and verified in one pass, split it.
5. **Forcing a confirmation pause when the user asked for a complete plan.** Pause by default for interactive planning; continue when the request clearly asks for full output.
6. **Implementing while planning.** This skill creates the task artifact and stops.
