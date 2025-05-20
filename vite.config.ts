import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // testNamePattern: '**/test/**/*.test.ts',
    globalSetup: './setup-test.js',
  },
});
