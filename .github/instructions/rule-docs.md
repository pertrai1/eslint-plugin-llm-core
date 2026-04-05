---
applyTo: "docs/rules/**/*.md"
---

# Rule Documentation

## Doc File Structure

Each rule needs a `docs/rules/<rule-name>.md` with this structure:

```markdown
# llm-core/<rule-name>

<!-- A one-line description followed by config badges will be auto-injected by update:eslint-docs -->
<!-- end auto-generated rule header -->

Brief explanation of what the rule does and why it matters for LLM-generated code.

## Rule Details

Detailed description of when the rule triggers. Explain what counts as a violation and what doesn't.

## Examples

### Incorrect

\`\`\`ts
// Description of why this is wrong
<code example>
\`\`\`

### Correct

\`\`\`ts
// Description of why this is right
<code example>
\`\`\`

## What Counts as [Relevant Concept]

| Pattern               | Triggers? |
| --------------------- | --------- |
| <pattern description> | Yes / No  |

## Error Messages

The error message teaches:

1. **What's wrong** -- summary of the violation
2. **Why** -- why this pattern is problematic
3. **How to fix** -- concrete alternatives
```

## Key Conventions

- Always frame rationale around LLM-generated code patterns (why LLMs produce this anti-pattern)
- Use TypeScript (`ts`) for code fence language tags
- Include a "What Counts" table when the rule has nuanced triggering logic
- Provide multiple correct examples showing different valid approaches

## Auto-Generated Headers

After creating the docs file, run `npm run update:eslint-docs` to inject the auto-generated rule header (description and config badges). The header goes between the `# llm-core/<rule-name>` title and the `<!-- end auto-generated rule header -->` comment.
