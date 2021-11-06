import { BuildContextArgs, gql, GraphQLServer, InferContext } from '@graphql-ez/pack-fastify';

function buildContext({ req }: BuildContextArgs) {
  return {
    req,
  };
}

declare module 'graphql-ez' {
  interface EZContext extends InferContext<typeof buildContext> {}
}

const { start } = GraphQLServer({
  serverOptions: {
    logger: true,
  },
  codegen: true,
  websockets: true,
  uploads: true,
  schema: {
    typeDefs: gql`
      type Query {
        hello: String!
      }
    `,
    resolvers: {
      Query: {
        hello(_root, _args, { req }) {
          return `Hello ${req.headers.name || 'World'}!`;
        },
      },
    },
  },
  buildContext,
});

start().catch(err => {
  console.error(err);
  process.exit(1);
});
