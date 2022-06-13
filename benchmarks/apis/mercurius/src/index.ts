import { schema } from 'benchmark-bench';
import Fastify from 'fastify';
import mercurius from 'mercurius';
import { requireEnv } from 'require-env-variable';
import type { GraphQLSchema } from 'graphql';

const app = Fastify({
  logger: process.env.NODE_ENV !== 'production',
});

process.env.CACHE && console.log('Cache enabled with Mercurius!');
process.env.JIT && console.log('Jit Enabled with Mercurius!');

// @ts-ignore mismatch between graphql versions
app.register(mercurius, {
  schema,
  jit: process.env.JIT ? 1 : -1,
  cache: !!process.env.CACHE,
});

app.listen({
  port: parseInt(requireEnv('PORT').PORT),
});
