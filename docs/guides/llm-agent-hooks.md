# Protecting Project Architecture with LLM Agent Hooks

LLM agents can generate code that works but quietly violates your project's architecture — renaming config files, adding `eslint-disable` comments, flattening directory boundaries, or pulling in unnecessary dependencies. Lint rules catch some of this at the code level. Hooks catch the rest at the workflow level.

This guide shows how to use **git hooks**, **CI checks**, and **agent-level hooks** (like Claude Code hooks) to enforce architectural guardrails that LLMs cannot bypass.

---

## Table of Contents

- [Git Pre-Commit Hooks](#git-pre-commit-hooks)
  - [Protect ESLint Configuration](#protect-eslint-configuration)
  - [Block eslint-disable Comments](#block-eslint-disable-comments)
  - [Enforce Directory Boundaries](#enforce-directory-boundaries)
  - [Prevent Dependency Sprawl](#prevent-dependency-sprawl)
- [CI Pipeline Checks](#ci-pipeline-checks)
  - [Architecture Boundary Check](#architecture-boundary-check)
  - [File Length and Complexity Gate](#file-length-and-complexity-gate)
- [Agent-Level Hooks (Claude Code)](#agent-level-hooks-claude-code)
  - [Block Config Modifications](#block-config-modifications)
  - [Require Tests for New Files](#require-tests-for-new-files)
  - [Enforce Naming Conventions on File Creation](#enforce-naming-conventions-on-file-creation)
- [Combining Layers](#combining-layers)

---

## Git Pre-Commit Hooks

Git hooks run before a commit is finalized. They are the last line of defense before code enters version control. Use a tool like [husky](https://github.com/typicode/husky) or [lefthook](https://github.com/evilmartians/lefthook) to manage them, or drop scripts directly into `.git/hooks/`.

### Protect ESLint Configuration

Prevents any staged changes to ESLint config files. This stops LLM agents from weakening rules, changing severity levels, or disabling plugins.

```bash
#!/bin/bash
# .git/hooks/pre-commit (or via husky/lefthook)
# Block modifications to ESLint configuration files

PROTECTED_PATTERNS='(eslint\.config\.|\.eslintrc|\.eslintignore)'
CHANGED_CONFIGS=$(git diff --cached --name-only | grep -E "$PROTECTED_PATTERNS")

if [ -n "$CHANGED_CONFIGS" ]; then
  echo "❌ ESLint config modification blocked:"
  echo "$CHANGED_CONFIGS" | sed 's/^/   /'
  echo ""
  echo "ESLint configuration is protected. If this change is intentional,"
  echo "commit with: git commit --no-verify"
  exit 1
fi
```

### Block eslint-disable Comments

Catches newly added `eslint-disable` comments in staged changes. Works alongside the `llm-core/no-inline-disable` rule — this hook catches cases where ESLint itself might not run (e.g., files excluded from lint).

```bash
#!/bin/bash
# Block new eslint-disable comments in staged files

DISABLE_PATTERN='eslint-disable(-next-line|-line)?'
NEW_DISABLES=$(git diff --cached -U0 --diff-filter=ACMR | grep '^\+' | grep -v '^\+\+\+' | grep -E "$DISABLE_PATTERN")

if [ -n "$NEW_DISABLES" ]; then
  echo "❌ New eslint-disable comment(s) detected:"
  echo "$NEW_DISABLES" | sed 's/^/   /'
  echo ""
  echo "Fix the underlying issue instead of suppressing the rule."
  echo "If this is a legitimate exception, commit with: git commit --no-verify"
  exit 1
fi
```

### Enforce Directory Boundaries

Prevents files from being created in the wrong directories. This is critical for projects with layered architecture (e.g., domain logic should never import from infrastructure, UI components shouldn't live in `src/api/`).

```bash
#!/bin/bash
# Enforce directory structure rules
# Customize RULES for your project's architecture

declare -A RULES=(
  # Pattern: "directory_regex|forbidden_file_pattern|message"
  ["api_components"]="^src/api/.*\.tsx$|React components do not belong in src/api/. Use src/components/."
  ["domain_imports"]="^src/domain/.*|import.*from.*(infrastructure|api|ui)|Domain layer must not import from infrastructure, API, or UI layers."
  ["test_location"]="^src/.*\.test\.(ts|tsx)$|Test files must be in tests/, not alongside source files."
)

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACR)
VIOLATIONS=""

for rule_name in "${!RULES[@]}"; do
  IFS='|' read -r file_pattern forbidden_pattern message <<< "${RULES[$rule_name]}"

  matching_files=$(echo "$STAGED_FILES" | grep -E "$file_pattern")

  if [ -n "$matching_files" ] && [ -n "$forbidden_pattern" ]; then
    for file in $matching_files; do
      if grep -qE "$forbidden_pattern" "$file" 2>/dev/null; then
        VIOLATIONS+="   $file: $message\n"
      fi
    done
  elif [ -n "$matching_files" ] && [ -z "$forbidden_pattern" ]; then
    for file in $matching_files; do
      VIOLATIONS+="   $file: $message\n"
    done
  fi
done

if [ -n "$VIOLATIONS" ]; then
  echo "❌ Architecture boundary violation(s):"
  echo -e "$VIOLATIONS"
  exit 1
fi
```

### Prevent Dependency Sprawl

LLMs tend to `npm install` packages for problems that can be solved with existing dependencies or standard library. This hook flags new dependencies added to `package.json`.

```bash
#!/bin/bash
# Flag new dependencies added to package.json

if git diff --cached --name-only | grep -q "package.json"; then
  NEW_DEPS=$(git diff --cached -U0 package.json | grep '^\+' | grep -v '^\+\+\+' | grep -E '"[^"]+"\s*:\s*"[\^~]?[0-9]')

  if [ -n "$NEW_DEPS" ]; then
    echo "⚠️  New dependency detected in package.json:"
    echo "$NEW_DEPS" | sed 's/^/   /'
    echo ""
    echo "Verify this dependency is necessary and not duplicating existing functionality."
    echo "Existing dependencies:"
    node -e "const p = require('./package.json'); console.log(Object.keys({...p.dependencies, ...p.devDependencies}).sort().join('\n'))" | sed 's/^/   /'
    echo ""
    echo "To proceed: git commit --no-verify"
    exit 1
  fi
fi
```

---

## CI Pipeline Checks

CI checks run on every push or pull request. They are harder to bypass than local hooks and provide a centralized enforcement point.

### Architecture Boundary Check

A CI job that validates import boundaries. This example checks that domain code never imports from infrastructure.

```yaml
# .github/workflows/architecture.yml
name: Architecture Check

on: [pull_request]

jobs:
  boundaries:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - name: Check domain layer boundaries
        run: |
          VIOLATIONS=$(grep -rn "from.*['\"].*infrastructure\|from.*['\"].*api\|from.*['\"].*ui" src/domain/ || true)
          if [ -n "$VIOLATIONS" ]; then
            echo "❌ Domain layer boundary violation:"
            echo "$VIOLATIONS"
            exit 1
          fi

      - name: Check for eslint-disable comments
        run: |
          DISABLES=$(grep -rn "eslint-disable" src/ --include="*.ts" --include="*.tsx" || true)
          if [ -n "$DISABLES" ]; then
            echo "❌ eslint-disable comments found:"
            echo "$DISABLES"
            echo "Fix the code instead of suppressing the rule."
            exit 1
          fi

      - name: Check for protected file modifications
        run: |
          PROTECTED="eslint.config .eslintrc .prettierrc tsconfig.json"
          CHANGED=$(git diff --name-only origin/main...HEAD)
          for file_pattern in $PROTECTED; do
            MATCHES=$(echo "$CHANGED" | grep "$file_pattern" || true)
            if [ -n "$MATCHES" ]; then
              echo "⚠️  Protected file modified: $MATCHES"
              echo "Ensure this change was intentional and reviewed by a human."
            fi
          done
```

### File Length and Complexity Gate

Rejects PRs that introduce files exceeding length or complexity thresholds — a common LLM failure mode where everything gets dumped into one file.

```yaml
# Add to existing CI workflow
- name: Check file length limits
  run: |
    MAX_LINES=300
    VIOLATIONS=""
    for file in $(git diff --name-only origin/main...HEAD -- '*.ts' '*.tsx'); do
      if [ -f "$file" ]; then
        LINES=$(wc -l < "$file" | tr -d ' ')
        if [ "$LINES" -gt "$MAX_LINES" ]; then
          VIOLATIONS+="   $file: $LINES lines (max $MAX_LINES)\n"
        fi
      fi
    done
    if [ -n "$VIOLATIONS" ]; then
      echo "❌ File(s) exceed maximum length:"
      echo -e "$VIOLATIONS"
      echo "Break large files into focused modules."
      exit 1
    fi
```

---

## Agent-Level Hooks (Claude Code)

[Claude Code hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) run inside the agent's execution loop — before or after specific tool calls. They can block actions before they happen, unlike git hooks which only catch things at commit time.

These hooks are configured in `.claude/settings.json`:

### Block Config Modifications

Prevents the agent from editing protected configuration files entirely. The agent never gets to write the change — the hook blocks the tool call.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "FILEPATH=\"$TOOL_INPUT_path\"; echo \"$FILEPATH\" | grep -qE '(eslint\\.config\\.|tsconfig|prettier|\\.env)' && echo 'BLOCKED: Cannot modify project configuration files. These are human-managed.' && exit 1 || exit 0"
          }
        ]
      }
    ]
  }
}
```

### Require Tests for New Files

When the agent creates a new source file, this hook reminds it that a corresponding test file is expected. It runs after the file is written, giving the agent immediate feedback.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "FILEPATH=\"$TOOL_INPUT_path\"; if echo \"$FILEPATH\" | grep -qE '^src/.*\\.ts$' && ! echo \"$FILEPATH\" | grep -qE '(\\.test\\.|\\.spec\\.|index\\.ts|types\\.ts)'; then TEST_PATH=$(echo \"$FILEPATH\" | sed 's|^src/|tests/|' | sed 's|\\.ts$|.test.ts|'); if [ ! -f \"$TEST_PATH\" ]; then echo \"WARNING: New source file created without corresponding test. Expected: $TEST_PATH\"; fi; fi; exit 0"
          }
        ]
      }
    ]
  }
}
```

### Enforce Naming Conventions on File Creation

Validates that new files follow the project's naming conventions (e.g., kebab-case for source files).

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "FILEPATH=\"$TOOL_INPUT_path\"; if echo \"$FILEPATH\" | grep -qE '^src/.*\\.ts$'; then BASENAME=$(basename \"$FILEPATH\" .ts); if ! echo \"$BASENAME\" | grep -qE '^[a-z][a-z0-9]*(-[a-z0-9]+)*$'; then echo \"BLOCKED: File name '$BASENAME' must be kebab-case (e.g., my-module.ts).\" && exit 1; fi; fi; exit 0"
          }
        ]
      }
    ]
  }
}
```

---

## Combining Layers

No single layer catches everything. Use all three together for defense in depth:

| Layer              | When it runs      | What it catches                 | Bypassable?              |
| ------------------ | ----------------- | ------------------------------- | ------------------------ |
| **Agent hooks**    | During generation | Bad actions before they happen  | Only by editing settings |
| **Git pre-commit** | At commit time    | Violations in staged changes    | `--no-verify` (logged)   |
| **CI checks**      | On push/PR        | Everything that slipped through | Requires admin override  |

**Recommended setup:**

1. **Agent hooks** — Block config edits, enforce naming conventions, require tests. Fastest feedback loop.
2. **Git pre-commit** — Catch `eslint-disable` comments, dependency sprawl, directory violations. Runs locally.
3. **CI pipeline** — Architecture boundaries, file length, protected file audit. Cannot be bypassed without review.

The goal is not to prevent all mistakes — it's to make the correct path easier than the incorrect one. When an LLM agent hits a hook rejection with a clear message ("Fix the code instead of disabling the rule"), it self-corrects. After a few iterations, it stops attempting the violation entirely.
