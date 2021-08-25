import { readFileSync } from 'fs';
import { resolve } from 'path';

declare const global: typeof globalThis & {
  __GRAPHIQL_JS__: string;
  __GRAPHIQL_CSS__: string;
};

global.__GRAPHIQL_JS__ = JSON.stringify(
  readFileSync(resolve(__dirname, '../../../packages/helix/graphiql/bundle/graphiql.min.js'), {
    encoding: 'utf-8',
  })
);
global.__GRAPHIQL_CSS__ = JSON.stringify(
  readFileSync(resolve(__dirname, '../../../packages/helix/graphiql/bundle/graphiql.css'), {
    encoding: 'utf-8',
  })
).replace('</script>', '<\\/script>');
