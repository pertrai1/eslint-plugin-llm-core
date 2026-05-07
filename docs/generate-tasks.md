# Rule: Generating a Task List from a PRD

## Goal

To guide an AI assistant in creating a detailed implementation task list in Markdown format from an existing Product Requirements Document (PRD). The task list should be explicit, ordered, and suitable for a junior developer to execute without guessing at scope.

## Process

1. **Receive PRD Reference:** The user provides or identifies an existing PRD file in `/tasks` named `prd-[feature-name].md`.
2. **Parse the PRD:** Read the PRD and extract the feature overview, goals, user stories, functional requirements, non-goals, technical considerations, success metrics, and open questions.
3. **Ask Clarifying Questions:** If the PRD leaves material implementation ambiguity, ask only the 3-5 most important clarifying questions before generating tasks. Provide A/B/C/D options where possible so the user can respond quickly.
4. **Generate High-Level Tasks:** Create 4-8 high-level tasks mapped to PRD sections or requirement numbers. Each task should represent a meaningful implementation milestone.
5. **Confirm Task Direction:** Present the high-level tasks and ask the user to confirm which tasks should be expanded.
6. **Expand Selected Tasks:** Break confirmed tasks into numbered sub-tasks with acceptance criteria, dependencies, and rough estimates.
7. **Save Task List:** Save the generated document as `tasks-prd-[feature-name].md` inside the `/tasks` directory.

## Clarifying Questions (Guidelines)

Ask questions only when the answer is not reasonably inferable from the PRD and would materially change the task plan. Common areas that may need clarification:

- **Priority:** If requirements compete, ask which outcome matters most.
- **Scope:** If a requirement could be implemented at multiple depths, ask where to draw the line.
- **Dependencies:** If the PRD names integrations or systems without details, ask which dependency should be used.
- **Acceptance:** If success criteria are vague, ask what observable behavior proves completion.
- **Sequencing:** If multiple delivery paths are possible, ask whether the user wants a minimal slice first or a complete implementation pass.

### Formatting Requirements

- **Number all questions** (1, 2, 3, etc.).
- **List options for each question as A, B, C, D, etc.** when practical.
- Make it simple for the user to respond with selections like `1A, 2C, 3B`.

### Example Clarifying Questions

```text
1. Which implementation path should be prioritized?
   A. Smallest working vertical slice
   B. Complete backend behavior first
   C. Complete UI behavior first
   D. Test infrastructure first

2. What level of test coverage is expected for this feature?
   A. Unit tests only
   B. Unit and integration tests
   C. End-to-end coverage for the primary workflow
   D. Follow existing adjacent coverage only

3. How should unresolved PRD questions be handled?
   A. Block task generation until answered
   B. Include them as explicit assumptions
   C. Turn them into discovery tasks
   D. Exclude them from the first implementation pass
```

## Task List Structure

The generated task list should include the following sections:

1. **Source PRD:** The input PRD filename and feature name.
2. **Summary:** A brief description of the implementation goal.
3. **Assumptions:** Any decisions made because the PRD did not specify details.
4. **High-Level Tasks:** 4-8 numbered tasks, each mapped to one or more PRD sections or requirement numbers.
5. **Sub-Tasks:** Numbered sub-tasks nested under each confirmed high-level task.
6. **Acceptance Criteria:** Observable completion checks for each high-level task.
7. **Dependencies:** Internal modules, external services, docs, or decisions needed before or during implementation.
8. **Estimates:** Rough effort labels such as Small, Medium, or Large.
9. **Out of Scope:** PRD items or implementation ideas intentionally excluded from this task list.

### Example Task Format

```markdown
1. Add persisted session loading
   - PRD mapping: Functional Requirements 1, 3
   - Estimate: Medium
   - Dependencies: Existing session storage module
   - Acceptance criteria:
     - Given a saved session exists, the CLI resumes it when the user passes `--resume`.
     - Given no saved session exists, the CLI starts normally and reports no resume error.
   - Sub-tasks:
     1.1. Add a session lookup function to the persistence layer.
     1.2. Wire the lookup into CLI startup.
     1.3. Add tests for existing-session and missing-session paths.
```

## Naming Conventions

- **Input PRD pattern:** `/tasks/prd-[feature-name].md`
- **Output task list pattern:** `/tasks/tasks-prd-[feature-name].md`
- Preserve the PRD feature slug in the task-list filename.

## What Not to Include

- Do not include implementation code.
- Do not invent requirements that are not present in the PRD or confirmed by the user.
- Do not expand speculative future work unless it is explicitly marked out of scope or deferred.
- Do not skip acceptance criteria for tasks that change behavior.

## Target Audience

Assume the primary reader is a **junior developer**. Tasks should be concrete, sequenced, and written with enough context to start implementation without rereading the entire PRD for every step.

## Output

- **Format:** Markdown (`.md`)
- **Location:** `/tasks/`
- **Filename:** `tasks-prd-[feature-name].md`

## Final Instructions

1. Do NOT start implementing the tasks.
2. Make sure every high-level task maps back to the source PRD.
3. Ask clarifying questions before task generation when ambiguity would change scope, sequencing, or acceptance criteria.
4. Save the final task list using the `tasks-prd-[feature-name].md` filename pattern.
