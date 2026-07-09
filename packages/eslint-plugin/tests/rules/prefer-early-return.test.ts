import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/prefer-early-return";
import { describe, it, afterAll } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("prefer-early-return", rule, {
  valid: [
    // Function with multiple statements (not just an if)
    `function process(data: string) {
      const cleaned = data.trim();
      if (cleaned) {
        save(cleaned);
        log(cleaned);
      }
    }`,

    // Function with short if body (1 statement, below default threshold)
    `function check(x: number) {
      if (x > 0) {
        doSomething();
      }
    }`,

    // Function with if/else where both branches are substantial
    `function handle(type: string) {
      if (type === "a") {
        processA();
        saveA();
      } else {
        processB();
        saveB();
      }
    }`,

    // Function with if/else-if chain
    `function classify(x: number) {
      if (x > 0) {
        handlePositive();
        logPositive();
      } else if (x < 0) {
        handleNegative();
        logNegative();
      } else {
        handleZero();
        logZero();
      }
    }`,

    // Function with no if statement
    `function simple(x: number) {
      return x * 2;
    }`,

    // Arrow function with expression body
    "const fn = (x: number) => x * 2;",

    // Empty function
    "function empty() {}",

    // Function with only a return
    "function identity(x: number) { return x; }",

    // Already uses early return (guard clause)
    `function process(data: string | null) {
      if (!data) return;
      transform(data);
      save(data);
    }`,

    // If body has 1 statement with custom threshold of 3
    {
      code: `function check(x: number) {
        if (x > 0) {
          doSomething();
          doMore();
        }
      }`,
      options: [{ minBodyStatements: 3 }],
    },

    // Multiple statements in function, if is not the only one
    `function multi(x: number) {
      setup();
      if (x > 0) {
        doSomething();
        doMore();
      }
    }`,

    // Else-if (not a simple wrapping pattern)
    `function decide(x: number) {
      if (x > 0) {
        processPositive();
        logPositive();
      } else if (x === 0) {
        throw new Error("zero not allowed");
      }
    }`,
  ],

  invalid: [
    // Basic: function body is a single if with no else
    {
      code: `function process(data: string) {
        if (isValid(data)) {
          transform(data);
          save(data);
        }
      }`,
      errors: [{ messageId: "preferEarlyReturn" as const }],
    },

    // With short else (single throw)
    {
      code: `function process(data: string) {
        if (isValid(data)) {
          transform(data);
          save(data);
        } else {
          throw new Error("invalid data");
        }
      }`,
      errors: [{ messageId: "preferEarlyReturn" as const }],
    },

    // With short else (single return)
    {
      code: `function findUser(id: string) {
        if (id) {
          const user = lookup(id);
          return user;
        } else {
          return null;
        }
      }`,
      errors: [{ messageId: "preferEarlyReturn" as const }],
    },

    // Arrow function with block body
    {
      code: `const process = (data: string) => {
        if (data) {
          transform(data);
          save(data);
        }
      };`,
      errors: [{ messageId: "preferEarlyReturn" as const }],
    },

    // Function expression
    {
      code: `const handler = function(event: Event) {
        if (event.target) {
          process(event.target);
          respond(event.target);
        }
      };`,
      errors: [{ messageId: "preferEarlyReturn" as const }],
    },

    // Async function
    {
      code: `async function fetchData(url: string) {
        if (url) {
          const response = await fetch(url);
          return response.json();
        }
      }`,
      errors: [{ messageId: "preferEarlyReturn" as const }],
    },

    // Method in object (function expression)
    {
      code: `const obj = {
        process: function(data: string) {
          if (data) {
            transform(data);
            save(data);
          }
        }
      };`,
      errors: [{ messageId: "preferEarlyReturn" as const }],
    },

    // Else with direct throw (no block)
    {
      code: `function validate(input: string) {
        if (input.length > 0) {
          parse(input);
          process(input);
        } else throw new Error("empty input");
      }`,
      errors: [{ messageId: "preferEarlyReturn" as const }],
    },

    // Else with direct return (no block)
    {
      code: `function tryParse(json: string) {
        if (json) {
          const parsed = JSON.parse(json);
          return parsed;
        } else return null;
      }`,
      errors: [{ messageId: "preferEarlyReturn" as const }],
    },

    // Custom minBodyStatements of 1
    {
      code: `function check(x: number) {
        if (x > 0) {
          doSomething();
        }
      }`,
      options: [{ minBodyStatements: 1 }],
      errors: [{ messageId: "preferEarlyReturn" as const }],
    },

    // Deeply nested if body
    {
      code: `function complex(data: Record<string, unknown>) {
        if (data) {
          validate(data);
          transform(data);
          save(data);
          notify(data);
          log(data);
        }
      }`,
      errors: [{ messageId: "preferEarlyReturn" as const }],
    },
  ],
});
