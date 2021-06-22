import { BuildContextArgs, CreateApp, gql, InferDataLoader, InferFunctionReturn, readStreamToBuffer } from '@graphql-ez/fastify';

function buildContext({ req, ws }: BuildContextArgs) {
  return {
    req,
    foo: ws ? 'ws' : 'http',
  };
}

export const { registerModule, buildApp, registerDataLoader } = CreateApp({
  allowBatchedQueries: true,
  GraphQLUpload: true,
  codegen: {
    federation: true,
    deepPartialResolvers: true,
    targetPath: './src/envelop.generated.ts',

    scalars: {
      DateTime: 'string',
    },
    documents: 'src/graphql/*',
  },
  outputSchema: './schema.gql',
  scalars: {
    DateTime: 1,
  },
  buildContext,
  websockets: {
    graphQLWS: true,
    subscriptionsTransport: true,
  },
  ide: {
    altair: true,
    graphiql: {
      subscriptionsEndpoint: 'http://localhost:3000/graphql',
    },
  },
  routeOptions: {
    logLevel: 'info',
  },
  schema: {
    typeDefs: gql`
      type Query {
        hello3: String!
      }
      type Mutation {
        uploadFileToBase64(file: Upload!): String!
      }
    `,
    resolvers: {
      Query: {
        hello3(_root, _args, ctx) {
          return ctx.stringRepeater.load('123');
        },
      },
      Mutation: {
        async uploadFileToBase64(_root, { file }) {
          const fileBuffer = await readStreamToBuffer(file);

          return fileBuffer.toString('base64');
        },
      },
    },
  },
  jit: true,
});

const stringRepeatear = registerDataLoader('stringRepeater', DataLoader => {
  return new DataLoader(async (keys: readonly string[]) => {
    return keys.map(v => v.repeat(5));
  });
});
declare module '@graphql-ez/fastify' {
  interface EnvelopContext extends InferFunctionReturn<typeof buildContext>, InferDataLoader<typeof stringRepeatear> {}
}

export { gql };
