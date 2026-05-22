# Rule Rationale

`eslint-plugin-llm-core` is not a general-purpose ESLint replacement. A rule belongs in this plugin when it catches a coding failure mode that is common, costly, or especially likely in LLM/agent-generated code, and when the diagnostic can teach an agent how to self-correct.

This document explains why each current rule earns its place in the plugin. Use it when proposing new rules, reviewing rule PRs, or deciding whether a rule belongs in `recommended`, `all`, or a narrower config.

## Inclusion Criteria

A strong `llm-core` rule satisfies most of these criteria:

1. **LLM-shaped failure mode** — The mistake appears in generated or agent-edited code because the model follows a plausible-but-wrong pattern.
2. **Correctness, safety, or reviewability impact** — The rule prevents bugs, misleading code, unsafe behavior, technical debt, or predictable review churn.
3. **High signal** — The rule is narrow enough that violations usually deserve attention.
4. **Actionable teaching message** — The rule explains what happened, why it matters, and how to fix it.
5. **Agent self-correction potential** — An agent should be able to read the lint output and produce a correct fix without human interpretation.
6. **Clear overlap story** — If other tools catch part of the issue, this plugin still adds value through LLM-focused scope, defaults, or teaching-oriented feedback.

## Rule Proposal Template

New rule proposals should answer these questions before implementation:

```md
### `llm-core/rule-name`

**Category:** correctness | safety | maintainability | hygiene | style | TypeScript | complexity

**Why this belongs in llm-core:**
Explain the LLM/agent-specific failure mode.

**Common generated-code mistake:**
Show the bad pattern.

**Preferred pattern:**
Show the desired pattern.

**Why existing tools are not enough:**
Explain whether TypeScript, ESLint core, typescript-eslint, or common configs already catch it.

**False-positive risk:** Low | Medium | High.
Explain known edge cases.

**Autofix or suggestion:**
State whether the rule can safely fix, should only suggest, or should report only.

**Recommended config:**
State where the rule belongs: `recommended`, `all`, category config, or experimental.

**Agent eval idea:**
Describe a small prompt/code scenario where an agent should fix the violation correctly.
```

## Current Rule Inventory

| Rule                                                                            | Category                | Why it belongs                                                                                                                   |
| ------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [`bad-comparison-sequence`](rules/bad-comparison-sequence.md)                   | correctness             | LLMs translate mathematical notation like `0 < x < 1` into JavaScript, where it becomes a boolean-to-number comparison.          |
| [`bad-min-max-func`](rules/bad-min-max-func.md)                                 | correctness             | LLMs frequently generate clamp logic and can invert `Math.min`/`Math.max` bounds into expressions that always return a constant. |
| [`consistent-catch-param-name`](rules/consistent-catch-param-name.md)           | style / reliability     | Consistent `catch` naming makes generated error-handling patterns easier for agents to recognize, preserve, and improve.         |
| [`explicit-export-types`](rules/explicit-export-types.md)                       | TypeScript              | LLMs often rely on inferred public API types, making exports harder to review and more fragile across edits.                     |
| [`filename-match-export`](rules/filename-match-export.md)                       | style / navigation      | LLMs navigate by names and nearby context; mismatched filenames and exports increase wrong-file edits and review friction.       |
| [`max-complexity`](rules/max-complexity.md)                                     | complexity              | LLMs tend to accrete branching logic; complexity limits force decomposition before code becomes hard to reason about.            |
| [`max-file-length`](rules/max-file-length.md)                                   | complexity              | LLMs are prone to large file edits and catch-all modules; file limits keep context boundaries reviewable.                        |
| [`max-function-length`](rules/max-function-length.md)                           | complexity              | LLMs often produce long procedural functions; length limits push extraction of named steps and reduce hidden behavior.           |
| [`max-nesting-depth`](rules/max-nesting-depth.md)                               | complexity              | LLMs frequently nest conditionals instead of using guard clauses, making generated code harder to audit.                         |
| [`max-params`](rules/max-params.md)                                             | complexity              | LLMs add parameters incrementally; parameter limits encourage object parameters and clearer contracts.                           |
| [`missing-throw`](rules/missing-throw.md)                                       | correctness             | LLMs sometimes write `new Error(...)` as a standalone statement, silently failing to stop execution.                             |
| [`naming-conventions`](rules/naming-conventions.md)                             | style / semantics       | Semantic naming conventions help agents infer intent and avoid treating abstract classes or error classes as ordinary values.    |
| [`no-any-in-generic`](rules/no-any-in-generic.md)                               | TypeScript              | LLMs use `any` inside generics as an escape hatch, erasing the safety of otherwise typed APIs.                                   |
| [`no-async-array-callbacks`](rules/no-async-array-callbacks.md)                 | async correctness       | LLMs use `async` callbacks in array methods that do not await promises, causing dropped work and misleading sequencing.          |
| [`no-commented-out-code`](rules/no-commented-out-code.md)                       | hygiene                 | LLMs leave abandoned alternatives and commented code that pollute context and can be mistaken for active examples.               |
| [`no-empty-catch`](rules/no-empty-catch.md)                                     | reliability             | LLMs suppress failures with empty or comment-only `catch` blocks instead of handling or propagating errors.                      |
| [`no-exported-function-expressions`](rules/no-exported-function-expressions.md) | style / debuggability   | LLMs overuse arrow exports; declarations improve stack traces, hoisting behavior, and public API readability.                    |
| [`no-floating-promise`](rules/no-floating-promise.md)                           | async correctness       | LLMs forget to await, return, or explicitly discard promises, creating races and unhandled failures.                             |
| [`no-incorrect-sort`](rules/no-incorrect-sort.md)                               | correctness             | LLMs omit numeric compare functions for `.sort()`, producing lexicographic ordering bugs that typecheck.                         |
| [`no-inline-disable`](rules/no-inline-disable.md)                               | hygiene / feedback loop | Agents may suppress lint output instead of fixing root causes; this preserves the lint feedback loop.                            |
| [`no-llm-artifacts`](rules/no-llm-artifacts.md)                                 | hygiene                 | Directly catches generated-code residue such as placeholders, TODO stubs, and incomplete implementation markers.                 |
| [`no-magic-numbers`](rules/no-magic-numbers.md)                                 | maintainability         | LLMs embed unexplained constants; named constants preserve intent for later agent and human edits.                               |
| [`no-redundant-logic`](rules/no-redundant-logic.md)                             | correctness / style     | LLMs generate redundant boolean checks and unnecessary control flow that obscure the real condition.                             |
| [`no-swallowed-errors`](rules/no-swallowed-errors.md)                           | reliability             | LLMs log errors and continue, losing failure semantics and making upstream code believe work succeeded.                          |
| [`no-type-assertion-any`](rules/no-type-assertion-any.md)                       | TypeScript              | LLMs use `as any` to bypass type errors instead of resolving the contract mismatch.                                              |
| [`prefer-early-return`](rules/prefer-early-return.md)                           | readability             | LLMs wrap entire functions in conditionals; guard clauses make failure paths and main paths easier to audit.                     |
| [`prefer-nullish-coalescing`](rules/prefer-nullish-coalescing.md)               | correctness             | LLMs use logical OR for defaults and accidentally replace valid falsy values like `0`, `false`, and `""`.                        |
| [`prefer-unknown-in-catch`](rules/prefer-unknown-in-catch.md)                   | TypeScript              | LLMs type caught errors as `any`, hiding unsafe property access in error handling.                                               |
| [`structured-logging`](rules/structured-logging.md)                             | observability           | LLMs interpolate dynamic values into log strings, reducing queryability and structured log quality.                              |
| [`throw-error-objects`](rules/throw-error-objects.md)                           | reliability             | LLMs throw strings or plain objects, losing stack traces and standard error semantics.                                           |
| [`uninvoked-array-callback`](rules/uninvoked-array-callback.md)                 | correctness             | LLMs use sparse arrays like `new Array(n).map(...)` expecting callbacks to run, but JavaScript skips holes.                      |

## Detailed Rationale

### `llm-core/bad-comparison-sequence`

**Category:** correctness

**Why this belongs in llm-core:** LLMs often translate mathematical range notation directly into JavaScript/TypeScript. The resulting expression typechecks and looks plausible, but evaluates as a chained binary comparison with boolean coercion.

**Common generated-code mistake:** `if (0 <= ratio <= 1) { ... }`

**Preferred pattern:** `if (0 <= ratio && ratio <= 1) { ... }`

**False-positive risk:** Low. Chained comparisons in JavaScript are almost always unintended.

**Autofix or suggestion:** Suggestion is appropriate; an automatic rewrite needs to preserve operators and operands carefully.

**Agent eval idea:** Give an agent a ratio validation using chained comparison and expect it to split the range check into two comparisons joined with `&&`.

### `llm-core/bad-min-max-func`

**Category:** correctness

**Why this belongs in llm-core:** Clamp code is a common generated pattern. LLMs can invert min/max bounds in a way that creates a constant result while still looking like a normal clamp expression.

**Common generated-code mistake:** `Math.min(Math.max(100, value), 0)`

**Preferred pattern:** `Math.min(Math.max(value, 0), 100)`

**False-positive risk:** Low when literal bounds prove the expression is constant.

**Autofix or suggestion:** Report-only or suggestion. A safe fix depends on knowing the intended lower and upper bounds.

**Agent eval idea:** Ask the agent to implement percentage clamping and verify it fixes reversed bounds without changing unrelated `Math.min`/`Math.max` calls.

### `llm-core/consistent-catch-param-name`

**Category:** style / reliability

**Why this belongs in llm-core:** Generated error handling is easier to inspect and improve when the caught error has a consistent name. Inconsistent names increase the chance that an agent drops the original error or references the wrong variable while refactoring.

**False-positive risk:** Low. Projects can configure the preferred name if their convention differs.

**Autofix or suggestion:** Suggestion is useful when references can be renamed safely.

**Agent eval idea:** Give an agent multiple `catch` blocks with inconsistent parameter names and expect a consistent rename that preserves references.

### `llm-core/explicit-export-types`

**Category:** TypeScript

**Why this belongs in llm-core:** LLMs often rely on inference for exported functions. That makes public contracts implicit and can allow later edits to change API shape accidentally while tests still pass.

**False-positive risk:** Medium. Internal-only projects may accept inferred exports, but published or shared code benefits from explicit contracts.

**Autofix or suggestion:** Report-only. Inferring and inserting correct public types requires type information and human/API intent.

**Agent eval idea:** Give an exported function without annotations and expect the agent to add parameter and return types without weakening types to `any`.

### `llm-core/filename-match-export`

**Category:** style / navigation

**Why this belongs in llm-core:** Agents navigate code by filenames, symbols, and local context. When a file's primary export does not match the filename, agents are more likely to edit the wrong file or duplicate functionality.

**False-positive risk:** Medium for barrel files, mixed modules, or framework conventions; the rule should stay scoped to simple single-export files.

**Autofix or suggestion:** Report-only. Renaming files or exports has import and API consequences.

**Agent eval idea:** Give a single-export file with a mismatched name and expect the agent to identify whether the file or export should be renamed.

### `llm-core/max-complexity`

**Category:** complexity

**Why this belongs in llm-core:** LLMs frequently keep adding branches to existing functions. Complexity limits force agents to decompose logic into named helpers before the code becomes difficult to verify.

**False-positive risk:** Medium. Some algorithms are inherently complex, but generated application code usually benefits from decomposition.

**Autofix or suggestion:** Report-only. Safe decomposition requires judgment.

**Agent eval idea:** Give an over-complex generated function and expect the agent to extract coherent helpers while preserving behavior.

### `llm-core/max-file-length`

**Category:** complexity

**Why this belongs in llm-core:** Agents can produce large files because appending code is easier than finding the right abstraction. File-length pressure preserves module boundaries and reduces context overload for future agent passes.

**False-positive risk:** Medium. Generated files and dense configuration may need exceptions.

**Autofix or suggestion:** Report-only. Splitting files affects imports, exports, and architecture.

**Agent eval idea:** Give a large mixed-responsibility module and expect the agent to propose or perform a minimal split along existing boundaries.

### `llm-core/max-function-length`

**Category:** complexity

**Why this belongs in llm-core:** LLMs often generate long procedural functions with hidden substeps. Function-length limits push the agent to name intermediate concepts and reduce review burden.

**False-positive risk:** Medium. Some glue code can be long but simple.

**Autofix or suggestion:** Report-only. Extraction requires choosing useful names and boundaries.

**Agent eval idea:** Give a long handler and expect the agent to extract validation, transformation, and persistence helpers without changing behavior.

### `llm-core/max-nesting-depth`

**Category:** complexity

**Why this belongs in llm-core:** Deep nesting is a common generated-code smell. It hides failure paths and makes it harder for both humans and agents to see the main path.

**False-positive risk:** Low to medium. Guard clauses are usually clearer, but some nested domain checks are intentional.

**Autofix or suggestion:** Report-only. Rewriting nested control flow can change behavior.

**Agent eval idea:** Give nested validation logic and expect the agent to convert it into guard clauses with equivalent behavior.

### `llm-core/max-params`

**Category:** complexity

**Why this belongs in llm-core:** Agents often append parameters as requirements evolve. A parameter limit forces the creation of named option objects and clearer contracts.

**False-positive risk:** Medium. Some callbacks or framework APIs have fixed signatures.

**Autofix or suggestion:** Report-only. Changing signatures affects call sites.

**Agent eval idea:** Give a function with too many parameters and expect the agent to introduce a typed options object and update local callers.

### `llm-core/missing-throw`

**Category:** correctness

**Why this belongs in llm-core:** A standalone `new Error(...)` in a guard branch is a plausible generated mistake. The code appears to handle the error but execution continues.

**Common generated-code mistake:** `if (!user) { new Error("User not found"); }`

**Preferred pattern:** `if (!user) { throw new Error("User not found"); }`

**False-positive risk:** Low when scoped to expression statements constructing error objects.

**Autofix or suggestion:** Suggestion can be safe in simple expression-statement cases.

**Agent eval idea:** Give a guard clause with standalone error construction and expect the agent to add `throw` rather than adding unrelated handling.

### `llm-core/naming-conventions`

**Category:** style / semantics

**Why this belongs in llm-core:** Naming carries semantic hints that agents use heavily. Consistent abstract-class and error-class names reduce the chance of incorrect instantiation, catching, or inheritance decisions.

**False-positive risk:** Medium. Naming conventions vary by project.

**Autofix or suggestion:** Report-only. Renames can be public API changes.

**Agent eval idea:** Give an error class without an `Error` suffix and expect the agent to either rename safely or explain API impact.

### `llm-core/no-any-in-generic`

**Category:** TypeScript

**Why this belongs in llm-core:** LLMs use `any` in generic arguments when uncertain, which turns typed containers and API results into untyped escape hatches.

**False-positive risk:** Low. Intentional `any` in generics should be rare and explicit.

**Autofix or suggestion:** Report-only. The right replacement type depends on domain intent.

**Agent eval idea:** Give `Promise<any>` or `Record<string, any>` and expect the agent to introduce a specific type or `unknown` where appropriate.

### `llm-core/no-async-array-callbacks`

**Category:** async correctness

**Why this belongs in llm-core:** LLMs often put `async` callbacks in `forEach`, `filter`, or similar array methods expecting sequencing or promise handling that JavaScript does not provide.

**False-positive risk:** Low to medium depending on method. `map(async ...)` can be correct when paired with `Promise.all`, but many array methods are clear hazards.

**Autofix or suggestion:** Report-only. Correct fixes vary between `for...of`, `Promise.all`, and explicit async control flow.

**Agent eval idea:** Give `items.forEach(async item => ...)` and expect the agent to rewrite to `for...of` or `Promise.all` based on required ordering.

### `llm-core/no-commented-out-code`

**Category:** hygiene

**Why this belongs in llm-core:** Agents frequently leave obsolete attempts in comments. Later agents may treat that code as guidance or revive it accidentally.

**False-positive risk:** Medium. Documentation examples and snippets must be excluded or configured.

**Autofix or suggestion:** Report-only. Deleting comments should be intentional.

**Agent eval idea:** Give a source file with an old commented implementation and expect the agent to remove it while preserving explanatory comments.

### `llm-core/no-empty-catch`

**Category:** reliability

**Why this belongs in llm-core:** Empty `catch` blocks are a common way generated code hides failures. They make test success misleading because real errors disappear.

**False-positive risk:** Low. Intentional ignores should still be explicit and justified.

**Autofix or suggestion:** Report-only. Correct handling depends on whether to rethrow, wrap, log, or recover.

**Agent eval idea:** Give an empty `catch` and expect the agent to preserve failure semantics or document an intentional ignore with a concrete reason.

### `llm-core/no-exported-function-expressions`

**Category:** style / debuggability

**Why this belongs in llm-core:** LLMs default to arrow functions for everything. Top-level exported declarations are easier to scan, produce clearer stack traces, and better signal public API intent.

**False-positive risk:** Low to medium. Some frameworks or APIs require expression exports.

**Autofix or suggestion:** Suggestion works for simple exported function expressions.

**Agent eval idea:** Give `export const fetchData = async () => {}` and expect the agent to convert it to `export async function fetchData()`.

### `llm-core/no-floating-promise`

**Category:** async correctness

**Why this belongs in llm-core:** LLMs frequently call async functions without awaiting or returning them. This creates races, unhandled rejections, and tests that pass before work completes.

**False-positive risk:** Medium. Fire-and-forget calls exist, but should be marked explicitly with `void` or a project-specific helper.

**Autofix or suggestion:** Report-only. Whether to `await`, `return`, or `void` depends on intent.

**Agent eval idea:** Give a handler that calls `saveUser(user)` without awaiting and expect the agent to choose `await` or `return` based on the surrounding function.

### `llm-core/no-incorrect-sort`

**Category:** correctness

**Why this belongs in llm-core:** LLMs often write `.sort()` for numbers, dates, or priorities without a comparator. JavaScript sorts strings by default, so numeric code silently misorders values.

**False-positive risk:** Medium. String arrays may intentionally use default sort.

**Autofix or suggestion:** Report-only unless element type or literals make numeric intent obvious.

**Agent eval idea:** Give `[10, 2, 1].sort()` and expect the agent to add `(a, b) => a - b`.

### `llm-core/no-inline-disable`

**Category:** hygiene / feedback loop

**Why this belongs in llm-core:** Agent workflows depend on lint output as corrective feedback. Inline disables let agents bypass the learning loop instead of addressing the root cause.

**False-positive risk:** Medium. Legacy migrations may need explicit policy exceptions.

**Autofix or suggestion:** Report-only. Removing a disable may reveal other errors that need real fixes.

**Agent eval idea:** Give code with `eslint-disable-next-line` and expect the agent to fix the violation rather than suppress it.

### `llm-core/no-llm-artifacts`

**Category:** hygiene

**Why this belongs in llm-core:** This rule directly targets generated-code residue: placeholders, apology text, fake TODOs, and incomplete implementation markers that agents sometimes leave behind.

**False-positive risk:** Low to medium. Documentation about LLMs may include artifact strings intentionally.

**Autofix or suggestion:** Report-only. The agent must replace placeholders with real implementation or remove them intentionally.

**Agent eval idea:** Give code containing `TODO: implement later` or placeholder returns and expect the agent to complete or remove the artifact.

### `llm-core/no-magic-numbers`

**Category:** maintainability

**Why this belongs in llm-core:** LLMs commonly embed constants without naming the domain concept. Named constants make later agent edits less likely to change the wrong value.

**False-positive risk:** Medium. Small conventional values and test data need sensible allowances.

**Autofix or suggestion:** Report-only. Good constant names require domain understanding.

**Agent eval idea:** Give timeout/retry/limit literals and expect the agent to extract named constants that explain intent.

### `llm-core/no-redundant-logic`

**Category:** correctness / style

**Why this belongs in llm-core:** LLMs produce redundant conditions while trying to be defensive. Redundant logic can hide impossible branches and make reviewers question whether a missing case exists.

**False-positive risk:** Low when matching deterministic boolean redundancies.

**Autofix or suggestion:** Suggestion is appropriate for simple redundant expressions.

**Agent eval idea:** Give `if (isReady || isReady)` or redundant ternaries and expect the agent to simplify without changing semantics.

### `llm-core/no-swallowed-errors`

**Category:** reliability

**Why this belongs in llm-core:** LLMs often catch an error, log it, and continue. That makes upstream code believe the operation succeeded and creates hard-to-debug partial failures.

**False-positive risk:** Medium. Some best-effort operations intentionally log and continue, but those should be explicit.

**Autofix or suggestion:** Report-only. Correct handling depends on recovery semantics.

**Agent eval idea:** Give `catch (error) { console.error(error); }` and expect the agent to rethrow, return a failure result, or document intentional best-effort behavior.

### `llm-core/no-type-assertion-any`

**Category:** TypeScript

**Why this belongs in llm-core:** `as any` is a common agent shortcut when TypeScript resists a generated implementation. It hides the mismatch instead of fixing the contract.

**False-positive risk:** Low. Temporary escape hatches should not remain in production code.

**Autofix or suggestion:** Report-only. The right fix may require narrowing, better types, or API changes.

**Agent eval idea:** Give a failing type assertion to `any` and expect the agent to introduce a specific type guard or correct interface.

### `llm-core/prefer-early-return`

**Category:** readability

**Why this belongs in llm-core:** LLMs often wrap whole functions in success-path conditionals. Early returns make preconditions explicit and reduce nested code that is hard to review.

**False-positive risk:** Medium. Some short functions are clearer with a single conditional.

**Autofix or suggestion:** Report-only. Control-flow rewrites require care.

**Agent eval idea:** Give a function wrapped in `if (valid) { ... }` and expect the agent to invert the condition into a guard clause.

### `llm-core/prefer-nullish-coalescing`

**Category:** correctness

**Why this belongs in llm-core:** LLMs often use `||` for default values because it is a common JavaScript idiom, but it silently treats valid falsy values like `0`, `false`, and `""` as missing.

**Common generated-code mistake:** `const retryCount = options.retryCount || 3;`

**Preferred pattern:** `const retryCount = options.retryCount ?? 3;`

**False-positive risk:** Medium. Boolean logic and intentional falsy fallback should not be rewritten.

**Autofix or suggestion:** Suggestion only. Replacing `||` with `??` changes runtime behavior.

**Agent eval idea:** Give code where `0` or `""` is a valid input and expect the agent to replace only fallback-style `||` expressions with `??`.

### `llm-core/prefer-unknown-in-catch`

**Category:** TypeScript

**Why this belongs in llm-core:** LLMs annotate caught errors as `any` and then access properties unsafely. `unknown` forces narrowing and safer error handling.

**False-positive risk:** Low for TypeScript code.

**Autofix or suggestion:** Report-only or suggestion from `any` to `unknown`; additional narrowing may be required.

**Agent eval idea:** Give `catch (error: any)` and expect the agent to use `unknown` plus an `instanceof Error` guard where needed.

### `llm-core/structured-logging`

**Category:** observability

**Why this belongs in llm-core:** LLMs interpolate dynamic values into log messages because it reads naturally. Structured logs need stable message strings with dynamic fields passed separately.

**False-positive risk:** Medium. Some logging APIs or human-facing logs intentionally use interpolated strings.

**Autofix or suggestion:** Report-only. Correct metadata shape depends on the logger.

**Agent eval idea:** Give `logger.error(`Failed for ${userId}`)` and expect the agent to produce `logger.error("Failed for user", { userId })` or the project equivalent.

### `llm-core/throw-error-objects`

**Category:** reliability

**Why this belongs in llm-core:** LLMs throw strings, template literals, or plain objects because they are concise. That loses stack traces, error names, and interoperability with normal error handling.

**False-positive risk:** Low. Throwing non-`Error` values is rarely desirable in production TypeScript/JavaScript.

**Autofix or suggestion:** Report-only or suggestion for simple string literals. Domain-specific error classes may be better than `Error`.

**Agent eval idea:** Give `throw "not found"` and expect the agent to throw an `Error` or domain-specific error object.

### `llm-core/uninvoked-array-callback`

**Category:** correctness

**Why this belongs in llm-core:** LLMs commonly use `new Array(n).map(...)` expecting the callback to run `n` times. Sparse arrays skip callbacks, so the generated code returns holes instead of values.

**Common generated-code mistake:** `const rows = new Array(5).map(() => createRow());`

**Preferred pattern:** `const rows = Array.from({ length: 5 }, () => createRow());`

**False-positive risk:** Low when detecting array callbacks on known sparse arrays.

**Autofix or suggestion:** Suggestion can be useful for direct `new Array(n).map(...)` cases.

**Agent eval idea:** Give a sparse-array mapping example and expect the agent to rewrite it to `Array.from` without changing the callback body.

## Keeping This Document Current

When adding, removing, or substantially changing a rule:

1. Update this document in the same PR.
2. Explain the LLM/agent failure mode, not just the generic JavaScript concern.
3. State false-positive risk and whether autofix/suggestions are safe.
4. Add or update an agent eval idea so future work can measure self-correction quality.
5. Keep the rationale concise; this document is a decision record, not a tutorial.
