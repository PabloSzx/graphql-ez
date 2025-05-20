import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    globalSetup: './setup-test.js',
    include: ['**/test/**/*.test.ts'],
    exclude: ['**/test-mocha/**/*.test.ts', '**/node_modules'],
  },
});
