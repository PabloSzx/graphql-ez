import { readFileSync } from 'fs';
import { resolve, sep } from 'path';

const isHelixGraphiql = process.cwd().endsWith(sep + 'graphiql');

export const config: import('bob-esbuild').BobConfig = {
  tsc: {
    dirs: ['packages/*/*', 'internal/*'],
  },
  verbose: false,
  outputOptions: {
    sourcemap: false,
    interop(moduleName) {
      if (moduleName) {
        if (moduleName.startsWith('ws')) return 'esModule';

        if (moduleName.startsWith('graphql-upload/public/')) return 'defaultOnly';
      }

      return 'auto';
    },
  },
  esbuildPluginOptions: isHelixGraphiql
    ? {
        target: 'node13.2',
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
