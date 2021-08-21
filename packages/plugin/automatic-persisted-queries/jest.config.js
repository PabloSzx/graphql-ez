const { getConfig } = require('graphql-ez-testing/jestConfig');

module.exports = getConfig({
  testTimeout: 15000,
});
