import Fastify from 'fastify';

import { CreateApp, gql, EZSchema } from '@graphql-ez/fastify';
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
  schema,
});

const { fastifyPlugin } = ezApp.buildApp({});

server.register(fastifyPlugin);

server.listen(8080);
