import { useGraphQlJit } from '@envelop/graphql-jit';
import { CreateApp } from '@graphql-ez/koa';
import KoaRouter from '@koa/router';
import { schema } from 'benchmark-bench';
import Koa from 'koa';
import { requireEnv } from 'require-env-variable';

const app = new Koa();

const router = new KoaRouter();

process.env.CACHE && console.log('Added Cache Plugins in EZ Koa');
process.env.JIT && console.log('Added JIT in EZ Koa');

CreateApp({
  schema,
  envelop: {
    plugins: !!process.env.JIT ? [useGraphQlJit()] : undefined,
  },
  cache: !!process.env.CACHE,
})
  .buildApp({
    router,
    app,
  })
  .then(() => {
    app.use(router.routes()).use(router.allowedMethods());

    app.listen(requireEnv('PORT').PORT);
  });
