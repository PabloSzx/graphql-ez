import { pathsToModuleNameMapper } from 'ts-jest/utils';
import { relative, resolve } from 'path';
import { readJSONSync } from 'fs-extra';

import type { Config } from '@jest/types';

const rootPath = resolve(__dirname, '../../../');

export function getConfig(): Config.InitialOptions {
  const prefix = `<rootDir>/${relative(process.cwd(), rootPath)}`;
  return {
    preset: 'ts-jest',
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
  };
}
