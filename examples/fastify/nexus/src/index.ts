import Fastify from 'fastify';

import { CreateApp } from '@graphql-ez/fastify';
import { ezAltairIDE } from '@graphql-ez/plugin-altair';

import { schema } from './schema';

const app = Fastify({
  logger: true,
});

const { buildApp } = CreateApp({
  schema,
  ez: {
    plugins: [
      ezAltairIDE({
        initialQuery: 'query{hello}',
      }),
    ],
  },
});

app.register(buildApp().fastifyPlugin);

app.listen({
  port: 8070,
});
