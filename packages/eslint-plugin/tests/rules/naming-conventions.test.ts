import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/naming-conventions";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("naming-conventions", rule, {
  valid: [
    // Abstract class with Base prefix
    "abstract class BaseService { abstract run(): void; }",
    "abstract class BaseRepository { abstract find(): void; }",

    // Error class with Error suffix
    "class NotFoundError extends Error {}",
    "class ValidationError extends Error {}",
    "class TimeoutError extends BaseError {}",
    "class CustomError extends AppError {}",

    // Non-abstract class — no prefix required
    "class UserService {}",
    "class OrderRepository {}",

    // Non-error class extending non-error — no suffix required
    "class Admin extends User {}",
    "class SpecialList extends Array {}",

    // Abstract class that already starts with Base
    "abstract class BaseEntity { abstract getId(): string; }",

    // Error class that already ends with Error
    "class HttpError extends Error {}",

    // Class without name (anonymous)
    "export default class {}",

    // Class extending member expression
    "class MyError extends errors.BaseError {}",
  ],

  invalid: [
    // Abstract class missing Base prefix
    {
      code: "abstract class Service { abstract run(): void; }",
      errors: [{ messageId: "missingBasePrefix" as const }],
    },
    {
      code: "abstract class Repository { abstract find(): void; }",
      errors: [{ messageId: "missingBasePrefix" as const }],
    },
    {
      code: "abstract class Handler { abstract handle(): void; }",
      errors: [{ messageId: "missingBasePrefix" as const }],
    },

    // Error class missing Error suffix
    {
      code: "class NotFound extends Error {}",
      errors: [{ messageId: "missingErrorSuffix" as const }],
    },
    {
      code: "class Validation extends Error {}",
      errors: [{ messageId: "missingErrorSuffix" as const }],
    },
    {
      code: "class Timeout extends BaseError {}",
      errors: [{ messageId: "missingErrorSuffix" as const }],
    },
    {
      code: "class BadRequest extends HttpError {}",
      errors: [{ messageId: "missingErrorSuffix" as const }],
    },

    // Both violations on same class
    {
      code: "abstract class Service extends Error { abstract run(): void; }",
      errors: [
        { messageId: "missingBasePrefix" as const },
        { messageId: "missingErrorSuffix" as const },
      ],
    },

    // Error class extending member expression
    {
      code: "class NotFound extends errors.BaseError {}",
      errors: [{ messageId: "missingErrorSuffix" as const }],
    },
  ],
});
