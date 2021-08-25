import { useGraphQlJit } from '@envelop/graphql-jit';
import { CreateApp } from '@graphql-ez/express';
import { schema } from 'benchmark-bench';
import Express from 'express';
import { requireEnv } from 'require-env-variable';

const app = Express();

process.env.CACHE && console.log('Added Cache Plugins in EZ Express');
process.env.JIT && console.log('Added JIT in EZ Express');

CreateApp({
  schema,
  envelop: {
    plugins: !!process.env.JIT ? [useGraphQlJit()] : undefined,
  },
  cache: !!process.env.CACHE,
})
  .buildApp({ app })
  .then(({ router }) => {
    app.use(router);

    app.listen(requireEnv('PORT').PORT);
  });
