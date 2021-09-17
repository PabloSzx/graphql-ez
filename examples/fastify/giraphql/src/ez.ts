import { CreateApp } from '@graphql-ez/fastify';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';

import { schema } from './schema';

export const ezApp = CreateApp({
  schema,
  ez: {
    plugins: [ezGraphiQLIDE()],
  },
});
