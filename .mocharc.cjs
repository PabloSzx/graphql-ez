const { resolve } = require('path');

process.env.NODE_ENV = 'test';

const config = {
  'enable-source-maps': true,
  spec: [resolve(__dirname, '**/test-mocha/**/*.ts')],
  require: [resolve(__dirname, './pre-mocha-test.mjs')],
  extension: ['ts'],
  'node-option': ['require=bob-tsm', 'loader=bob-tsm'],
};

module.exports = config;
