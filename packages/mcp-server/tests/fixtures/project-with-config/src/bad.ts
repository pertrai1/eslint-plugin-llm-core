// Intentionally violates llm-core/no-empty-catch (and core no-debugger).
// Used as a fixture target for lint_file integration tests.
export function riskyOperation(): void {
  debugger;
  try {
    JSON.parse("not valid json");
  } catch (_error) {}
}
