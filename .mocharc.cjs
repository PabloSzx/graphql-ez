const { join } = require('path');

process.env.NODE_ENV = 'test';

const config = {
  'enable-source-maps': true,
  spec: [join(process.cwd(), '**/test-mocha/**/*.ts')],
  require: [join(__dirname, './pre-mocha-test.mjs')],
  extension: ['ts'],
  'node-option': ['require=bob-tsm', 'loader=bob-tsm'],
};

module.exports = config;
