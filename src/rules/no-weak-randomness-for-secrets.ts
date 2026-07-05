import type { RuleInstruction } from "../instructions/types";
import { createRule } from "../utils/create-rule";

type Options = [
  {
    sensitiveNamePattern?: string;
    allowMathRandomForNonSensitiveNames?: boolean;
    checkFunctionReturnNames?: boolean;
  },
];

type MessageIds = "weakRandomnessForSecret";

const defaultOptions: Options = [
  {
    sensitiveNamePattern:
      "(token|secret|password|sessionId|apiKey|nonce|salt|resetCode|verificationCode|authCode|credential)",
    allowMathRandomForNonSensitiveNames: true,
    checkFunctionReturnNames: true,
  },
];

export default createRule<Options, MessageIds>({
  name: "no-weak-randomness-for-secrets",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow weak or predictable randomness when creating security-sensitive values",
    },
    messages: {
      weakRandomnessForSecret: [
        "Use cryptographic randomness for security-sensitive values.",
        "",
        "Why: Math.random(), timestamps, and counters are predictable. LLM-generated token or reset-code helpers often look unique but are guessable enough to compromise sessions, password resets, API keys, or nonces.",
        "",
        "How to fix:",
        '  Node: use crypto.randomBytes(32).toString("hex") or crypto.randomUUID().',
        "  Browser: use crypto.getRandomValues() and encode the bytes.",
      ].join("\n"),
    },
    schema: [
      {
        type: "object",
        properties: {
          sensitiveNamePattern: { type: "string" },
          allowMathRandomForNonSensitiveNames: { type: "boolean" },
          checkFunctionReturnNames: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions,
  create() {
    return {};
  },
});

export const instruction: RuleInstruction = {
  principle:
    "Use cryptographic randomness for tokens, secrets, sessions, nonces, salts, reset codes, API keys, and credentials",
};
