---
name: agent-permissions
description: Defines agent read/write/command/network permission boundaries and escalation behavior.
version: 1.0.0
required: false
category: workflow
tools:
  - claude
  - copilot
  - codex
  - cursor
triggers:
  - protected-file
  - risky-command
  - install-command
  - deploy-command
  - secrets
  - permissions
routing:
  load: conditional
  applies_to:
    - implementation
    - debugging
    - policy-change
    - review
---

# Agent Permissions Directive

**When to load:** Load this directive when work touches protected files, risky
commands, package manager operations, deployment, infrastructure, secrets, CI,
or repo policy. Adaptive routing selects it conditionally; it is not loaded for
every task.

This directive gives agents a portable least-privilege vocabulary. It does not
replace IDE permissions, harness permissions, sandboxing, CI gates, or future
deterministic enforcement artifacts. It tells the agent what to treat as
allowed, approval-required, or denied unless explicitly requested — and how to
escalate or report when policy blocks the work.

---

## Default Posture: Least Privilege

Use the narrowest action that completes the task. Do not expand into broader
file access, package installation, network calls, publishing, deployment, or
unrelated git operations unless the task requires them.

- Prefer targeted edits over whole-file rewrites.
- Prefer project-native verification commands over broad script execution.
- Prefer reading what is needed over reading entire trees.
- Prefer not transmitting repository data externally unless the task requires it.

If a less-privileged path achieves the goal, take it and note the choice.

---

## Protected Files (Approval Normally Required)

Treat the following file categories as approval-required before editing unless
project instructions explicitly state otherwise:

- `.env*` and secret-bearing configuration
- lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, etc.)
- package manager configuration (`package.json`, `pyproject.toml`, etc.)
- CI workflows (`.github/workflows/**`, `.gitlab-ci.yml`, etc.)
- deploy scripts and deployment configuration
- infrastructure or IaC files (`infra/**`, `terraform/`, `cdk/`, etc.)
- database migrations
- auth or security-sensitive configuration

When a task requires editing one of these categories, pause or escalate per the
protocol below before making the edit.

---

## Risky Commands (Approval Normally Required)

Treat the following command categories as approval-required before execution:

- dependency installation (`npm install`, `pip install`, etc.)
- package publishing (`npm publish`, etc.)
- deploys and deploy-script execution
- destructive git operations (`git reset --hard`, `git clean -fd`, etc.)
- force pushes (`git push --force`, `git push -f`, etc.)
- cloud or infrastructure commands (`terraform`, `kubectl`, `aws`, `gcloud`, etc.)
- commands that send repository data to external services

State the command, why it is needed, and the expected affected scope before
running it when approval is required.

---

## Denied Until Explicitly Requested

The following actions are denied unless the user explicitly requests and
approves them:

- deleting broad file trees (`rm -rf` on wide paths, etc.)
- rewriting unrelated git history
- disabling checks to make CI pass
- exposing or printing secrets

Do not perform these actions because they appear convenient. Wait for an
explicit user request and approval, then proceed only with the narrowest safe
form of the approved action.

---

## Escalation Protocol

Before taking an approval-required action, state:

1. **Action** — the requested file edit or command
2. **Why** — why it is needed for the task
3. **Affected scope** — files or commands that will change
4. **Risk** — the expected risk if it proceeds
5. **Approval** — whether project policy or tool permissions require approval

When approval is required, ask for it and wait for the user's decision before
proceeding. Do not rephrase a denied action to bypass the policy.

---

## Blocked Work Reporting

When permission policy blocks or narrows the work, report:

- the blocked action and the policy trigger
- safe alternatives attempted
- the remaining user decision needed to proceed
- any work deferred rather than quietly half-solved

Do not silently bypass the policy or continue on a riskier path because the safe
path was blocked.

---

## Advisory Boundary

This directive is advisory. It teaches the agent when to pause, ask, refuse, or
narrow work. Actual enforcement of file access, command execution, network use,
or deployment is the responsibility of the user's agent harness, IDE, sandbox,
CI, or a separate enforcement kit. Treat this directive as shared policy
vocabulary across supported tools, not as a sandbox.

---

## Forbidden Patterns

| Pattern                                                              | Why Forbidden                                  |
| -------------------------------------------------------------------- | ---------------------------------------------- |
| Editing protected files without escalation when approval is required | Bypasses policy at the most sensitive surfaces |
| Running risky commands without stating action, why, and scope        | Hides risk from the user                       |
| Performing denied actions because they appear convenient             | Denied-until-explicit means denied             |
| Printing or copying secrets to unblock work                          | Secrets must not be exposed                    |
| Silently switching to a riskier path when the safe path is blocked   | Recreates the risk the policy prevented        |
| Disabling checks to make CI pass                                     | Weakens gates that catch regressions           |
| Claiming this directive enforces permissions deterministically       | Advisory guidance is not enforcement           |

---

## Quick Reference

| Situation                              | Action                                             |
| -------------------------------------- | -------------------------------------------------- |
| Task touches a protected file category | Pause or escalate before editing                   |
| Task needs a risky command category    | State action, why, scope; ask if approval required |
| Action is denied-until-explicit        | Wait for explicit user request and approval        |
| Secret is encountered                  | Do not print, copy, commit, or expose it           |
| Safe path is blocked by policy         | Report the block and a safe next option            |
| User expects automatic enforcement     | State the advisory boundary clearly                |

_This directive complements adaptive routing: the router decides **when**
permission guidance matters, and this directive governs **how** the agent
behaves at risky surfaces._
