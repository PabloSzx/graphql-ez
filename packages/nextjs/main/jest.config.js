const { getConfig } = require('@graphql-ez/testing/jestConfig');

module.exports = getConfig({
  nextjs: ['test/main'],
});
