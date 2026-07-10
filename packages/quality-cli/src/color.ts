import type { QualityScanOptions } from "./types.js";

export function shouldUseColor(options: QualityScanOptions): boolean {
  if (options.color === "always") {
    return true;
  }

  if (options.color === "never") {
    return false;
  }

  return Boolean(
    process.stdout.isTTY &&
    !hasEnvironmentFlag("NO_COLOR") &&
    !hasEnabledEnvironmentFlag("CI"),
  );
}

function hasEnvironmentFlag(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(process.env, name);
}

function hasEnabledEnvironmentFlag(name: string): boolean {
  if (!hasEnvironmentFlag(name)) {
    return false;
  }

  const value = process.env[name]?.toLowerCase();
  return value !== "" && value !== "0" && value !== "false";
}
