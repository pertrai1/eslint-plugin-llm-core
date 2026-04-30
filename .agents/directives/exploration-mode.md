---
name: exploration-mode
description: Supports investigation and option discovery before committing to an implementation approach.
version: 1.0.0
triggers:
  - explore
  - investigate
  - compare-options
  - uncertain-approach
routing:
  load: conditional
---

# Exploration Mode Directive

**When to load:** Load this directive when the user wants to investigate, think through, or explore a problem before committing to an implementation approach. Also load when the user says "explore," "investigate," "think about," "what if," or "I'm not sure how to approach."

This directive governs a distinct pre-implementation phase: structured
investigation and thinking. It is not codebase navigation (how to search) or
task framing (how to scope work). It governs the **stance** the agent takes
when the right answer is not yet clear.

**Do not implement during exploration.** The purpose is to develop
understanding, surface options, and identify risks — not to write code.

---

## The Stance

During exploration, the agent adopts a specific posture:

- **Curious, not prescriptive** — Ask questions that emerge from what the user said. Don't follow a script or funnel toward a predetermined answer.
- **Open threads, not interrogations** — Surface multiple interesting directions and let the user follow what resonates.
- **Grounded in reality** — Explore the actual codebase when relevant. Don't just theorize. Read files, trace dependencies, map architecture.
- **Visual when it helps** — Use ASCII diagrams, tables, and structured layouts to clarify thinking. A good diagram is worth many paragraphs.
- **Patient** — Don't rush to conclusions. Let the shape of the problem emerge from investigation.
- **Comfortable with uncertainty** — If something is unclear, say so. Unresolved questions are a valid output of exploration.

---

## What Exploration Produces

Exploration may produce any combination of:

### Problem Understanding

- Clarified problem statement
- Identified constraints (explicit and implicit)
- Surfaced assumptions that need validation
- Reframed problem from a different angle

### Architecture Mapping

```
┌─────────────────────────────────────────────┐
│            CURRENT SYSTEM                   │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────┐    ┌──────────┐              │
│  │ Module A │───▶│ Module B │              │
│  └──────────┘    └────┬─────┘              │
│                       │                     │
│                       ▼                     │
│                 ┌──────────┐                │
│                 │ Module C │                │
│                 └──────────┘                │
│                                             │
└─────────────────────────────────────────────┘
```

- How existing components relate to the area under investigation
- Integration points and dependencies
- Data flow and control flow
- Where complexity lives

### Option Comparison

| Criterion   | Option A | Option B | Option C |
| ----------- | -------- | -------- | -------- |
| Complexity  | Low      | Medium   | High     |
| Performance | Fast     | Adequate | Fast     |
| Maintenance | Easy     | Moderate | Hard     |
| Risk        | Low      | Medium   | High     |

- Multiple approaches with tradeoffs made visible
- Constraints that favor or disfavor each option
- Recommendation (if asked) with reasoning

### Risk Surface

- What could go wrong
- Hidden complexity not obvious from the initial description
- Dependencies that might block or complicate the work
- Assumptions that, if wrong, would change the approach

---

## The Flow

Exploration is not a fixed sequence. It is a conversation that follows
interesting threads. The general pattern:

### 1. Listen

Receive what the user brings. It might be:

- A vague idea ("I'm thinking about adding real-time collaboration")
- A specific problem ("The auth system is a mess")
- A question ("Should we use Postgres or SQLite?")
- A blockage ("I'm stuck on the OAuth integration")

### 2. Ground

Before theorizing, check what actually exists:

- Read relevant source files (using codebase-navigation discipline)
- Trace the relevant architecture
- Identify current patterns and conventions
- Find existing constraints

### 3. Investigate

Follow the thread that seems most productive:

- Ask clarifying questions that emerge from the codebase
- Challenge assumptions — both the user's and your own
- Reframe the problem if the current framing seems incomplete
- Find analogies or prior art in the codebase

### 4. Surface

Present what you've found:

- Diagrams for architecture and flow
- Tables for comparisons and tradeoffs
- Lists for risks, unknowns, and open questions
- Plain language for insights and recommendations

### 5. Summarize (optional)

When the exploration feels like it's crystallizing, offer a summary:

```
## What We Figured Out

**The problem**: [crystallized understanding]

**The approach**: [if one emerged]

**Open questions**: [if any remain]

**Next steps** (if ready):
- Proceed to task framing and implementation
- Keep exploring: follow a specific thread
```

This summary is optional. Sometimes the thinking IS the value.

---

## Handling Different Entry Points

### Vague Idea

```
User: I'm thinking about adding real-time collaboration

Agent: [maps the problem space, surfaces options at different
       complexity levels, asks where the user's head is at]
```

Do not jump to "here's how we implement CRDTs." Explore the spectrum first.

### Specific Problem

```
User: The auth system is a mess

Agent: [reads the actual auth code, maps the tangle,
       identifies specific pain points, asks which one burns most]
```

Do not prescribe a full rewrite. Find the specific tangle first.

### Comparison Question

```
User: Should we use Postgres or SQLite?

Agent: [asks about context and constraints, then evaluates
       against the actual use case, not generic pros/cons]
```

Generic comparisons are boring. Ground them in the project's reality.

### Mid-Implementation Blockage

```
User: I'm stuck — the OAuth integration is more complex than expected

Agent: [reads the code where they're stuck, traces the actual
       complexity, surfaces options for simplifying or working around it]
```

Do not just suggest reading the docs. Investigate the actual blocker.

---

## Exploration vs. Other Directives

| Directive           | What it governs            | Phase          |
| ------------------- | -------------------------- | -------------- |
| Codebase Navigation | How to search efficiently  | Orientation    |
| Task Framing        | How to scope work          | Planning       |
| Exploration Mode    | How to think through       | Investigation  |
| Test-Driven Dev     | How to implement           | Implementation |
| Verification        | How to confirm correctness | Review         |

Exploration sits between navigation and framing. You orient (navigation),
investigate (exploration), scope (framing), implement (TDD), verify
(verification).

---

## Guardrails

| Guardrail                   | Why                                                            |
| --------------------------- | -------------------------------------------------------------- |
| No implementation code      | Writing code commits to an approach before exploration is done |
| No auto-capture of insights | Offer to save findings; let the user decide                    |
| No forced structure         | Exploration is conversational; let patterns emerge naturally   |
| No rushing to conclusions   | Premature solutions miss better options                        |
| No faking understanding     | If something is unclear, dig deeper rather than guessing       |

---

## Forbidden Patterns

| Pattern                                        | Why Forbidden                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Writing implementation code during exploration | Commits to approach before investigation is complete                            |
| Following a fixed question checklist           | Every exploration is different; scripts kill curiosity                          |
| Prescribing a solution in the first response   | Premature solutions skip the most valuable thinking                             |
| Theorizing without reading the codebase        | Ungrounded advice is noise                                                      |
| Producing a required artifact                  | Exploration may end with clarity, a decision, or more questions — all are valid |

---

## When Exploration Ends

There is no required ending. Exploration might:

- **Flow into task framing** — "I have a clear picture now. Want me to frame the task?"
- **Result in a decision** — "We should go with Option B because..."
- **Just provide clarity** — User has what they need, moves on
- **Continue later** — "We can pick this up anytime"

The signal that exploration is done: the user asks to implement something,
or a clear path forward has emerged and been confirmed.

---

_This directive applies to any investigation, brainstorm, or "what if" conversation. It is optional for straightforward tasks with obvious implementations._
