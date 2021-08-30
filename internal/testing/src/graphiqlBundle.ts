import { readFileSync } from 'fs';
import { resolve } from 'path';

declare const global: typeof globalThis & {
  __GRAPHIQL_PKG_NAME__: string;
  __GRAPHIQL_PKG_VERSION__: string;
};

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), './package.json'), {
    encoding: 'utf-8',
  })
);

global.__GRAPHIQL_PKG_NAME__ = packageJson.name;
global.__GRAPHIQL_PKG_VERSION__ = packageJson.version;
