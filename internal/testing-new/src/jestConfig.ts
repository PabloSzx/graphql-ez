import { pathsToModuleNameMapper } from 'ts-jest/utils';
import { relative, resolve } from 'path';
import { readJSONSync, writeFileSync } from 'fs-extra';
import { execSync } from 'child_process';
import type { Config } from '@jest/types';

const rootPath = resolve(__dirname, '../../../');

export function getConfig({
  nextjs,
}: {
  nextjs?: string[];
} = {}): Config.InitialOptions {
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

  return {
    preset: 'ts-jest',
    testMatch: [process.cwd().replace(/\\/g, '/') + '/test/**/*.test.ts'],
    testEnvironment: 'node',
    modulePathIgnorePatterns: ['/dist/'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/.next'],
    coveragePathIgnorePatterns: ['node_modules', '/.next'],
    globals: {
      'ts-jest': {
        diagnostics: false,
      },
    },
    moduleNameMapper: pathsToModuleNameMapper(readJSONSync(resolve(rootPath, 'tsconfig.json')).compilerOptions.paths, { prefix }),
    collectCoverage: true,
    globalSetup: nextjs ? './setup-test.js' : undefined,
  };
}
