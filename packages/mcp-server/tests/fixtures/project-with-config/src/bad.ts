// Intentionally violates llm-core/no-empty-catch.
// Used as a fixture target for lint_file integration tests.
export function riskyOperation(): void {
  try {
    JSON.parse("not valid json");
  } catch (_error) {}
}
