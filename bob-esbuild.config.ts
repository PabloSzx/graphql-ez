import { readFileSync } from 'fs';
import { resolve, sep } from 'path';

const isHelixGraphiql = process.cwd().endsWith(sep + 'graphiql');

export const config: import('bob-esbuild').BobConfig = {
  tsc: {
    dirs: ['packages/*/*', 'internal/*', 'yoga/*', 'benchmarks/bench'],
  },
  verbose: false,
  outputOptions: {
    sourcemap: false,
  },
  keepDynamicImport: ['get-port'],
  esbuildPluginOptions: isHelixGraphiql
    ? {
        define: (() => {
          const packageJson = JSON.parse(
            readFileSync(resolve(process.cwd(), './package.json'), {
              encoding: 'utf-8',
            })
          );

          return {
            __GRAPHIQL_PKG_NAME__: JSON.stringify(packageJson.name),
            __GRAPHIQL_PKG_VERSION__: JSON.stringify(packageJson.version),
          };
        })(),
      }
    : undefined,
};
