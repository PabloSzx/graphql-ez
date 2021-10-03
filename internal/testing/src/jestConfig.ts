import { pathsToModuleNameMapper } from 'ts-jest/utils';
import { relative, resolve } from 'path';
import fsExtra from 'fs-extra';
import { execSync } from 'child_process';
import type { Config } from '@jest/types';

const { readJSONSync, writeFileSync } = fsExtra;

const rootPath = resolve(__dirname, '../../../');

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
    transform: { '\\.[jt]sx?$': resolve(__dirname, 'esTransform.js') },
    globals: {
      'ts-jest': {
        isolatedModules: true,
      },
    },
    extensionsToTreatAsEsm: ['.ts'],
    modulePathIgnorePatterns: ['/dist/'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/.next'],
    coveragePathIgnorePatterns: ['node_modules', '/.next'],
    moduleNameMapper: pathsToModuleNameMapper(readJSONSync(resolve(rootPath, 'tsconfig.json')).compilerOptions.paths, { prefix }),
    collectCoverage: true,
    globalSetup: nextjs ? './setup-test.js' : undefined,
    watchman: false,
    testTimeout: 10000,
    cache: false,
    ...rest,
  };

  return config;
}
