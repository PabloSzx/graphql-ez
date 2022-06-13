import { useGraphQlJit } from '@envelop/graphql-jit';
import { CreateApp } from '@graphql-ez/fastify';
import { schema } from 'benchmark-bench';
import Fastify from 'fastify';
import { requireEnv } from 'require-env-variable';

const app = Fastify({
  logger: process.env.NODE_ENV !== 'production',
});

process.env.CACHE && console.log('Added Cache Plugins in EZ Fastify');
process.env.JIT && console.log('Added JIT in EZ Fastify');

app.register(
  CreateApp({
    schema,
    envelop: {
      plugins: !!process.env.JIT ? [useGraphQlJit()] : undefined,
    },
    cache: !!process.env.CACHE,
  }).buildApp({}).fastifyPlugin
);

app.listen({
  port: parseInt(requireEnv('PORT').PORT),
});
