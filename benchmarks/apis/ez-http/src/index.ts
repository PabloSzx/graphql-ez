import { useGraphQlJit } from '@envelop/graphql-jit';
import { CreateApp } from '@graphql-ez/http';
import { schema } from 'benchmark-bench';
import { createServer } from 'http';
import { requireEnv } from 'require-env-variable';

process.env.CACHE && console.log('Added Cache Plugins in EZ HTTP');
process.env.JIT && console.log('Added JIT in EZ HTTP');

const server = createServer((req, res) => {
  EZApp(req, res);
});

const EZApp = CreateApp({
  schema,
  envelop: {
    plugins: !!process.env.JIT ? [useGraphQlJit()] : undefined,
  },
  cache: !!process.env.CACHE,
}).buildApp({
  server,
}).requestHandler;

server.listen(parseInt(requireEnv('PORT').PORT));
