import 'reflect-metadata';

import Fastify from 'fastify';

import { buildSchema } from 'type-graphql';
import { CreateApp } from '@graphql-ez/fastify';
import { ezAltairIDE } from '@graphql-ez/plugin-altair';
import { QueryResolver } from './schema';

const app = Fastify({
  logger: true,
});

const ezApp = CreateApp({
  schema: buildSchema({
    resolvers: [QueryResolver],
    emitSchemaFile: true,
  }),
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

  app.listen(8080);
});
