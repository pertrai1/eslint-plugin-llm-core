// E2E fixture: custom config — exercises option interpolation,
// scope separation, off-rule exclusion, and warn/error equivalence.
import llmCore from "../../dist/index.js";

export default [
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs", "**/*.cjs"],
    plugins: { "llm-core": llmCore },
    rules: {
      // Custom numeric option — must appear interpolated in output
      "llm-core/max-function-length": ["error", { max: 30 }],
      // Warn severity — must render identically to error
      "llm-core/no-empty-catch": "warn",
      // Array option — must render as comma-separated list
      "llm-core/no-magic-numbers": ["error", { ignore: [0, 1, 2, -1] }],
      // No options — principle rendered as-is
      "llm-core/throw-error-objects": "error",
      // Off — must NOT appear in output
      "llm-core/no-llm-artifacts": "off",
      "llm-core/no-inline-disable": "off",
      "llm-core/no-commented-out-code": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // TS-only rule — must appear in TypeScript Files Only section
      "llm-core/explicit-export-types": "error",
    },
  },
];
