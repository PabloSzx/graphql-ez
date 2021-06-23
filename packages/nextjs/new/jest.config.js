const { getConfig } = require('@graphql-ez/testing-new/jestConfig');

module.exports = getConfig({
  nextJsDirs: ['test/main'],
});
