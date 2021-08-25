import { readFileSync } from 'fs';
import { resolve, sep } from 'path';

const isHelixGraphiql = process.cwd().endsWith(sep + 'graphiql');

export const config: import('bob-esbuild').BobConfig = {
  tsc: {
    dirs: ['packages/*/*', 'internal/*', 'yoga/*', 'benchmarks/bench'],
  },
  verbose: true,
  outputOptions: {
    sourcemap: false,
  },
  esbuildPluginOptions: isHelixGraphiql
    ? {
        define: {
          __GRAPHIQL_JS__: JSON.stringify(
            readFileSync(resolve(__dirname, './packages/helix/graphiql/bundle/graphiql.min.js'), {
              encoding: 'utf-8',
            })
          ),
          __GRAPHIQL_CSS__: JSON.stringify(
            readFileSync(resolve(__dirname, './packages/helix/graphiql/bundle/graphiql.css'), {
              encoding: 'utf-8',
            })
          ).replace('</script>', '<\\/script>'),
        },
      }
    : undefined,
};
