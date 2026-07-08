export const NO_CONFIG_MESSAGE = [
  "No ESLint configuration was discovered for this path.",
  "",
  "lint_file lints using your project's own ESLint config by default. To use",
  "project-config findings, install and configure eslint-plugin-llm-core in",
  "your project:",
  "",
  "  npm install --save-dev eslint eslint-plugin-llm-core",
  "",
  "Then add it to your flat config (eslint.config.js), for example:",
  "",
  '  import llmCore from "eslint-plugin-llm-core";',
  "  export default [...llmCore.configs.recommended];",
  "",
  "Alternatively, start the MCP server with LLM_CORE_MCP_ENABLE_FALLBACK=1 to",
  'enable read-only fallback findings labeled with source: "fallback".',
].join("\n");

export function outsideRootResponse(targetPath: string, projectRoot: string) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text:
          `Refusing to lint "${targetPath}": it resolves outside the ` +
          `project root (${projectRoot}). Pass a path within the project root.`,
      },
    ],
  };
}
