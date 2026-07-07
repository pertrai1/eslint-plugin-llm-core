// Expected violations: ~3
// Rules triggered:
//   no-dynamic-code-execution (3): eval, Function constructor, string timer
//
// Key challenge: replace string execution with explicit dispatch while preserving
// runtime-selected behavior. Teaching messages should guide the agent toward a
// typed action registry and callback timers instead of broader dynamic execution.

type ActionName = "refreshToken" | "poll";

declare function refreshToken(): void;
declare function poll(): void;
declare function readExpression(): string;

const RETRY_DELAY_MS = 1000;

const actionHandlers = {
  refreshToken,
  poll,
} satisfies Record<ActionName, () => void>;

export function runConfiguredAction(action: string): void {
  if (Object.prototype.hasOwnProperty.call(actionHandlers, action)) {
    actionHandlers[action as ActionName]();
    return;
  }

  eval(action);
}

export function buildPredicate(source: string): (value: unknown) => boolean {
  return new Function("value", `return ${source}`) as (
    value: unknown,
  ) => boolean;
}

export function scheduleRefresh(): void {
  const expression = readExpression();
  setTimeout(`refreshToken(); ${expression}`, RETRY_DELAY_MS);
}
