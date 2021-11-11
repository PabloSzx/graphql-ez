import type { Config } from '@jest/types';
import { execSync } from 'child_process';
import { readJSONSync, writeFileSync } from 'fs-extra';
import { relative, resolve } from 'path';
import { pathsToModuleNameMapper } from 'ts-jest/utils';

const rootPath = resolve(__dirname, '../../../');

process.env.TS_JEST_HOOKS = resolve(__dirname, 'tsJestHooks.js');

export function getConfig({
  nextjs,
  ...rest
}: {
  nextjs?: string[];
} & Config.InitialOptions = {}): Record<string, unknown> {
  const prefix = `<rootDir>/${relative(process.cwd(), rootPath)}`;

  if (nextjs) {
    writeFileSync(
      './setup-test.js',
      `const { execSync } = require('child_process');

      module.exports = async () => {
      ${nextjs
        .map(dir => {
          return `execSync(\`node \${require.resolve('next/dist/bin/next')} build "${dir}"\`, {
          stdio: 'inherit',
        });`;
        })
        .join('\n')}
      }`
    );

    execSync('prettier -w "./setup-test.js"');
  }

  const config: Config.InitialOptions = {
    testMatch: [process.cwd().replace(/\\/g, '/') + '/test/**/*.test.ts'],
    testEnvironment: 'node',
    transform: { '\\.[jt]sx?$': 'ts-jest' },
    globals: {
      'ts-jest': {
        isolatedModules: true,
      },
    },
    modulePathIgnorePatterns: ['/dist/'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/.next'],
    coveragePathIgnorePatterns: ['node_modules', '/.next'],
    moduleNameMapper: pathsToModuleNameMapper(readJSONSync(resolve(rootPath, 'tsconfig.json')).compilerOptions.paths, { prefix }),
    collectCoverage: true,
    globalSetup: nextjs ? './setup-test.js' : undefined,
    watchman: false,
    testTimeout: 10000,
    ...rest,
  };

  return config;
}
