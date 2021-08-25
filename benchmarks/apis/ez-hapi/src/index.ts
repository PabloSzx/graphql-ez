import { useGraphQlJit } from '@envelop/graphql-jit';
import { CreateApp } from '@graphql-ez/hapi';
import Hapi from '@hapi/hapi';
import { schema } from 'benchmark-bench';
import { requireEnv } from 'require-env-variable';

process.env.CACHE && console.log('Added Cache Plugins in EZ Hapi');
process.env.JIT && console.log('Added JIT in EZ Hapi');

async function init() {
  const port = requireEnv('PORT').PORT;

  const server = Hapi.server({
    port,
    host: 'localhost',
  });

  await server.register(
    (
      await CreateApp({
        schema,
        envelop: {
          plugins: !!process.env.JIT ? [useGraphQlJit()] : undefined,
        },
        cache: !!process.env.CACHE,
      }).buildApp({})
    ).hapiPlugin
  );

  await server.start();
}

init().catch(console.error);
