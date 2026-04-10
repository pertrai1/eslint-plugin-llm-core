import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/filename-match-export";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("filename-match-export", rule, {
  valid: [
    // Exact match
    {
      code: "export function UserService() {}",
      filename: "UserService.ts",
    },

    // kebab-case filename → camelCase export
    {
      code: "export function userService() {}",
      filename: "user-service.ts",
    },

    // kebab-case filename → PascalCase export
    {
      code: "export function UserService() {}",
      filename: "user-service.ts",
    },

    // kebab-case filename with acronym segments → PascalCase export
    {
      code: "export class BedrockKBRagTool {}",
      filename: "bedrock-kb-rag-tool.ts",
    },

    // kebab-case filename with multi-letter acronym segments → PascalCase export
    {
      code: "export class HttpAPIHandler {}",
      filename: "http-api-handler.ts",
    },

    // kebab-case filename with single-word PascalCase export
    {
      code: "export class BedrockHandler {}",
      filename: "bedrock-handler.ts",
    },

    // PascalCase filename → camelCase export
    {
      code: "export function userService() {}",
      filename: "UserService.ts",
    },

    // Class export matching filename
    {
      code: "export class UserRepository {}",
      filename: "UserRepository.ts",
    },

    // Default export with name matching
    {
      code: "export default function fetchData() {}",
      filename: "fetchData.ts",
    },

    // index.ts — always ignored
    {
      code: "export function anything() {}",
      filename: "index.ts",
    },

    // types.ts — ignored
    {
      code: "export interface Foo {}",
      filename: "types.ts",
    },

    // constants.ts — ignored
    {
      code: "export const API_URL = 'http://example.com';",
      filename: "constants.ts",
    },

    // enums.ts — ignored
    {
      code: "export enum Status { Active, Inactive }",
      filename: "enums.ts",
    },

    // errors.ts — ignored
    {
      code: "export class AppError extends Error {}",
      filename: "errors.ts",
    },

    // utils.ts — ignored
    {
      code: "export function doSomething() {}",
      filename: "utils.ts",
    },

    // helpers.ts — ignored
    {
      code: "export function doSomething() {}",
      filename: "helpers.ts",
    },

    // Test files — ignored
    {
      code: "export function unrelated() {}",
      filename: "foo.test.ts",
    },
    {
      code: "export function unrelated() {}",
      filename: "foo.spec.ts",
    },

    // Multiple exports — not enforced
    {
      code: "export function foo() {}\nexport function bar() {}",
      filename: "wrong-name.ts",
    },

    // Re-exports — not counted
    {
      code: "export { foo } from './foo';",
      filename: "whatever.ts",
    },

    // Anonymous default — nothing to match
    {
      code: "export default function() {}",
      filename: "whatever.ts",
    },

    // Variable export matching kebab filename
    {
      code: "export const createUser = () => {};",
      filename: "create-user.ts",
    },

    // Single type export matching filename
    {
      code: "export type UserConfig = { name: string };",
      filename: "UserConfig.ts",
    },

    // Single interface export matching filename
    {
      code: "export interface DatabaseConfig { host: string }",
      filename: "DatabaseConfig.ts",
    },

    // .tsx file
    {
      code: "export function Button() { return null; }",
      filename: "Button.tsx",
    },
  ],

  invalid: [
    // Simple mismatch
    {
      code: "export function UserService() {}",
      filename: "wrong-name.ts",
      errors: [{ messageId: "filenameMismatch" as const }],
    },

    // PascalCase export in kebab file that doesn't match
    {
      code: "export function UserService() {}",
      filename: "account-service.ts",
      errors: [{ messageId: "filenameMismatch" as const }],
    },

    // Class mismatch
    {
      code: "export class UserRepository {}",
      filename: "AccountRepository.ts",
      errors: [{ messageId: "filenameMismatch" as const }],
    },

    // kebab-case filename should still reject genuinely wrong exports
    {
      code: "export class OrderProcessor {}",
      filename: "user-service.ts",
      errors: [{ messageId: "filenameMismatch" as const }],
    },

    // Segment-wise kebab matching rejects collapsed names (foo-bar → Foobar)
    {
      code: "export class Foobar {}",
      filename: "foo-bar.ts",
      errors: [{ messageId: "filenameMismatch" as const }],
    },

    // Default export name mismatch
    {
      code: "export default function fetchData() {}",
      filename: "getData.ts",
      errors: [{ messageId: "filenameMismatch" as const }],
    },

    // Variable export mismatch
    {
      code: "export const createUser = () => {};",
      filename: "delete-user.ts",
      errors: [{ messageId: "filenameMismatch" as const }],
    },

    // Single type export mismatch
    {
      code: "export type UserConfig = { name: string };",
      filename: "AppConfig.ts",
      errors: [{ messageId: "filenameMismatch" as const }],
    },

    // tsx mismatch
    {
      code: "export function Button() { return null; }",
      filename: "Input.tsx",
      errors: [{ messageId: "filenameMismatch" as const }],
    },

    // Default export identifier mismatch
    {
      code: "const handler = () => {};\nexport default handler;",
      filename: "controller.ts",
      errors: [{ messageId: "filenameMismatch" as const }],
    },
  ],
});
