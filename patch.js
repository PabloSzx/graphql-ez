const { writeFileSync, readFileSync } = require('fs');

// This patch is due to changeset not respecting the convention of 0.x being major releases before 1.0

// Some info related to this https://docs.npmjs.com/cli/v7/using-npm/semver#caret-ranges-123-025-004

writeFileSync(
  require.resolve('@changesets/assemble-release-plan/dist/assemble-release-plan.cjs.dev.js'),
  readFileSync('patches/assemble-release-plan.cjs.dev.js', {
    encoding: 'utf-8',
  }),
  {
    encoding: 'utf-8',
  }
);
