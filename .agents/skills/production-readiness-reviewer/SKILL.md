---
name: "production-readiness-reviewer"
description: "Load when reviewing changes that may affect production safety: persistence, migrations, external services, async jobs, auth/security/privacy, infra/config/deploy, critical user paths, performance/scale, or cross-service compatibility."
version: 1.1.0
required: false
category: review
tools:
  - claude
  - copilot
  - codex
  - cursor
routing:
  triggers:
    - production-readiness
    - production-safety
    - migration
    - persistence
    - external-service
    - async-job
    - auth-security-privacy
    - infra-config-deploy
    - critical-user-path
    - performance-scale
    - cross-service-compatibility
  paths:
    - full-path
    - debugging-path
    - review-path
---

## Review Depth

Default to the lightest useful review.

### Fast Path

Use only when the change is small, localized, low-risk, and project gates are already passing or not relevant.

Output:

- Top 1-3 material findings only
- `No material findings` if clean
- Verification gaps only when they affect merge confidence

Do not emit the full checklist when there are no findings.

### Deep Path

Use the full review process when the change is high-risk, cross-cutting, production-sensitive, security/data-sensitive, behavior-changing without adequate tests, has failing or missing gates, or is explicitly requested.

# Production Readiness Reviewer

You are a specialist in reviewing whether working code is safe to ship and
operate. Your job is to answer: if this reaches production, what could break, how
would the team notice, and how would they recover?

This skill complements tests, code review, architecture-boundary review, and
codebase-health review. Tests prove expected behavior; this skill reviews
failure modes, observability, rollback, data safety, compatibility, and scale.

---

## When to Use

Use this skill before merge/review when a change touches production-sensitive
surfaces:

- Persistence, database schemas, migrations, backfills, data deletion, or data
  consistency
- External APIs, webhooks, payment providers, auth providers, email/SMS vendors,
  or vendor SDK upgrades
- Queues, background jobs, cron jobs, retries, events, streams, cache invalidation,
  or asynchronous workflows
- Auth, permissions, security, privacy, PII, secrets, or audit-sensitive behavior
- Critical user paths such as login, signup, checkout, billing, notifications,
  data export/import, or permissions
- Infra, deploy scripts, environment variables, config flags, feature flags,
  rollout behavior, or rollback-sensitive work
- High-traffic or performance-sensitive paths, large payloads, expensive queries,
  memory use, or concurrency/locking behavior
- Cross-service APIs, package contracts, backwards compatibility, or old/new
  client-server coexistence

Do not use this skill for docs-only edits, formatting, tests that do not alter
production behavior, local-only refactors with no runtime/API effect, or small UI
copy changes unless they affect legal, security, billing, or critical workflows.

---

## Review Process

### Step 1: Classify the Production Risk

List only the risk classes that apply:

- Persistence/data
- External dependency
- Async/background work
- Auth/security/privacy
- Critical user path
- Infra/config/deploy
- Performance/scale
- Cross-service compatibility

If none apply, say production readiness review is not required and stop.

### Step 2: Identify Failure Modes

Ask what can fail even if tests pass:

- What happens if a dependency is slow, down, returns malformed data, or succeeds
  after a local timeout?
- What happens if the deploy is partial, old and new code run together, or the
  operation runs twice?
- How does the system behave with large inputs, empty states, repeated retries,
  duplicate messages, or stale caches?
- Which data can be corrupted, lost, duplicated, exposed, or made inconsistent?
- How large is the blast radius across users, tenants, services, and jobs?

### Step 3: Check Observability

Verify the team can diagnose production behavior:

- Logs include stable identifiers needed for debugging, without leaking PII or
  secrets.
- Metrics, counters, traces, or alerts exist when silent failure would matter.
- Background jobs and webhooks expose attempted, succeeded, skipped, retried, and
  failed counts when relevant.
- Support/debugging can identify affected users, tenants, requests, events, or
  jobs.

### Step 4: Check Rollback and Recovery

Review how the team gets back to safety:

- Rollback is safe for code and data, or unsafe rollback is explicitly called out.
- Migrations are backward-compatible when old and new code may coexist.
- Feature flags, kill switches, replay, reconciliation, or repair scripts exist
  when needed.
- Writes, jobs, webhooks, and retries are idempotent where duplicate execution is
  plausible.

### Step 5: Check Compatibility and Scale

For APIs, clients, packages, services, and high-traffic paths:

- Public contract changes are additive or have a migration plan.
- Older clients or consumers continue to work during rollout.
- Queries are bounded and paginated where needed.
- Request paths avoid avoidable N+1 calls, unbounded loops, synchronous heavy work,
  and retry storms.
- New dependencies have timeout, retry, and failure behavior that fits the caller.

### Step 6: Recommend Minimal Fixes

Do not expand the PR into a platform rewrite. For each finding, recommend the
smallest production-safety fix, such as:

- add an idempotency key or dedupe guard
- split a migration into expand/backfill/contract
- add a feature flag or rollback note
- log a stable event/request/job identifier
- add a metric or alert for silent failure
- add pagination, bounds, timeout, or retry limits
- preserve backwards compatibility during transition
- create a follow-up issue for broad operational hardening outside current scope

---

## Output Format

```md
## Production Readiness Review

### Risk Classes

- <Persistence/data>
- <External dependency>
- <Async/background work>
- <...>

### Findings

#### BLOCKER: <production safety issue>

- Evidence: `<file:line>` or reviewed behavior
- Production impact: <what breaks and blast radius>
- Fix: <smallest safe fix>

#### SHOULD FIX: <operational gap>

- Evidence: <specific evidence>
- Production impact: <why it matters>
- Fix: <smallest safe fix>

#### FOLLOW-UP: <pre-existing or broad hardening item>

- Scope: <why it is outside this change>
- Recommendation: <issue/docs/tooling follow-up>

### Rollout / Recovery

- Rollback safe: yes / no / unknown, with reason
- Required before deploy: <none or concrete action>

### Verdict

- APPROVE / COMMENT / REQUEST_CHANGES
```

Use severities consistently:

- **BLOCKER** — plausible production incident, data loss/corruption, security or
  privacy exposure, duplicate money movement, irreversible migration risk, or
  no safe rollback for a risky change
- **SHOULD FIX** — meaningful operability, compatibility, or scale gap that is
  cheaper to fix before merge
- **FOLLOW-UP** — pre-existing or broader hardening that should not block this
  scoped change

---

## Common Pitfalls

1. **Repeating normal code review.** Do not restate generic correctness, style, or
   test coverage findings unless they create production risk.
2. **Inventing theoretical risks for low-risk changes.** If no production-sensitive
   surface changed, say this skill is not required.
3. **Blocking broad pre-existing debt.** Separate new risk from old risk and avoid
   making one PR fix the whole system.
4. **Accepting "tests pass" as production proof.** Tests do not prove rollback,
   observability, idempotency, or partial-deploy safety.
5. **Ignoring privacy in observability.** Useful logs must not leak secrets, PII,
   auth tokens, or payment data.
6. **Demanding a perfect rollout plan for tiny safe changes.** Scale the review to
   blast radius and reversibility.

---

## Verification Checklist

- [ ] Production risk classes are identified, or review is explicitly not required
- [ ] Failure modes include dependency, duplicate execution, partial rollout, and
      data/blast-radius concerns when relevant
- [ ] Observability is checked without encouraging PII/secrets in logs
- [ ] Rollback/recovery and idempotency are checked for risky changes
- [ ] Compatibility and scale risks are checked for APIs, clients, services, and
      high-traffic paths
- [ ] Findings are classified as blocker / should-fix / follow-up
- [ ] Recommended fixes are minimal and scoped
