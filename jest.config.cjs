const { getConfig } = require('graphql-ez-testing/jestConfig');

module.exports = getConfig({
  testMatch: ['**/test/**/*.test.ts'],
});
