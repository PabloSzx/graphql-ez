import 'reflect-metadata';

import Fastify from 'fastify';

import { CreateApp } from '@graphql-ez/fastify';
import { ezAltairIDE } from '@graphql-ez/plugin-altair';

import { schema } from './schema';

const app = Fastify({
  logger: true,
});

const ezApp = CreateApp({
  schema,
  ez: {
    plugins: [
      ezAltairIDE({
        initialQuery: 'query{hello}',
      }),
    ],
  },
});

app.register(ezApp.buildApp().fastifyPlugin);

app.ready(err => {
  if (err) {
    console.error(err);
    return;
  }

  app.listen({
    port: 8060,
  });
});
