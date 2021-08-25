import { readFileSync } from 'fs';
import { resolve } from 'path';

export const config: import('bob-esbuild').BobConfig = {
  tsc: {
    dirs: ['packages/*/*', 'internal/*', 'yoga/*', 'benchmarks/bench'],
  },
  verbose: true,
  outputOptions: {
    sourcemap: false,
  },
  esbuildPluginOptions: process.cwd().includes('/graphiql')
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
