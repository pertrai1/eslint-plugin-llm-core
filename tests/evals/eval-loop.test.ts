import { describe, expect, it } from "vitest";
import {
  collectExportedSymbolNames,
  preservesExportedApi,
} from "../../evals/src/eval-loop";

describe("eval fixture API preservation", () => {
  it("collects exported symbol names from function and const exports", () => {
    const code = [
      "export const buildClient = () => {};",
      "export async function fetchUser(): Promise<void> {}",
      "const hidden = () => {};",
    ].join("\n");

    expect(collectExportedSymbolNames(code)).toEqual([
      "buildClient",
      "fetchUser",
    ]);
  });

  it("skips re-exported names from other modules", () => {
    const code = [
      'export { buildClient } from "./shared";',
      "export function fetchUser(): void {}",
    ].join("\n");

    expect(collectExportedSymbolNames(code)).toEqual(["fetchUser"]);
  });

  it("requires candidate code to preserve all original exported names", () => {
    const original = [
      "export const buildClient = () => {};",
      "export async function fetchUser(): Promise<void> {}",
    ].join("\n");
    const candidate = "export async function fetchUser(): Promise<void> {}";

    expect(preservesExportedApi(original, candidate)).toBe(false);
  });

  it("accepts candidates that keep the exported api while refactoring internals", () => {
    const original = [
      "export const buildClient = () => {};",
      "export async function fetchUser(): Promise<void> {}",
    ].join("\n");
    const candidate = [
      "export function buildClient(): void {}",
      "export async function fetchUser(): Promise<void> {",
      "  return;",
      "}",
    ].join("\n");

    expect(preservesExportedApi(original, candidate)).toBe(true);
  });
});
