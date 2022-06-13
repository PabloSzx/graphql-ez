import Fastify from 'fastify';

import { buildApp } from './app';

const app = Fastify({
  logger: true,
});

app.register(
  buildApp({
    async prepare() {
      await import('./modules/index');
    },
  }).fastifyPlugin
);

app.ready(err => {
  if (!err) return;

  console.error(err);
  process.exit(1);
});

app.listen({
  port: (process.env.PORT && parseInt(process.env.PORT)) || 3000,
});
