/**
 * lint-staged configuration.
 *
 * ESLint intentionally skips files under tests/fixtures/ because those files
 * contain deliberate rule violations used as integration-test fixtures
 * (e.g. packages/mcp-server/tests/fixtures/). Prettier still runs on all
 * matched TypeScript files so formatting stays consistent.
 */
module.exports = {
  "*.ts": (files) => {
    const nonFixture = files.filter((f) => !f.includes("/tests/fixtures/"));
    const cmds = [];
    if (nonFixture.length > 0) {
      cmds.push(`eslint --fix ${nonFixture.join(" ")}`);
    }
    cmds.push(`prettier --write ${files.join(" ")}`);
    return cmds;
  },
  "*.{json,md,yml,yaml}": ["prettier --write"],
};
