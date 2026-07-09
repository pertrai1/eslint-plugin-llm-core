# llm-core/naming-conventions

📝 Enforce naming conventions: Base prefix for abstract classes, Error suffix for error classes.

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`, 🎨 `style`.

<!-- end auto-generated rule header -->

Enforce naming conventions: Base prefix for abstract classes, Error suffix for error classes.

## Rule Details

LLMs frequently create abstract classes without a `Base` prefix and error classes without an `Error` suffix. These naming conventions make class purpose immediately clear from the name alone.

### Checks

1. **Abstract classes** must start with `Base` (e.g., `BaseService`, `BaseRepository`)
2. **Error classes** (extending `Error` or any `*Error` class) must end with `Error` (e.g., `NotFoundError`, `ValidationError`)

## Examples

### Incorrect

```ts
// Missing Base prefix
abstract class Service {
  abstract run(): void;
}

// Missing Error suffix
class NotFound extends Error {
  constructor(message: string) {
    super(message);
  }
}

class BadRequest extends HttpError {}
```

### Correct

```ts
// Base prefix signals abstract class
abstract class BaseService {
  abstract run(): void;
}

// Error suffix signals error class
class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class BadRequestError extends HttpError {}
```

## Error Messages

Error messages follow a structured teaching format designed for LLM self-correction:

1. **What's wrong** — identifies the class name and missing prefix/suffix
2. **Why** — explains what the naming convention signals to readers
3. **How to fix** — shows the exact rename with the class's actual name
