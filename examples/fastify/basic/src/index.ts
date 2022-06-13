import Fastify from 'fastify';
import { ezSchema, EZSchema } from '@graphql-ez/plugin-schema';

import { CreateApp, gql } from '@graphql-ez/fastify';

const server = Fastify({
  logger: true,
});

const schema: EZSchema = {
  typeDefs: gql`
    type Query {
      hello: String!
    }
  `,
  resolvers: {
    Query: {
      hello(_root, _args, ctx) {
        console.log(ctx.request);
        return 'world';
      },
    },
  },
};

const ezApp = CreateApp({
  ez: {
    plugins: [
      ezSchema({
        schema,
      }),
    ],
  },
});

const { fastifyPlugin } = ezApp.buildApp({});

server.register(fastifyPlugin);

server.listen({
  port: 8080,
});
