import { CreateApp, BuildContextArgs, InferFunctionReturn, gql, readStreamToBuffer } from '@graphql-ez/koa';

function buildContext({ req }: BuildContextArgs) {
  return {
    req,
    foo: 'bar',
  };
}

declare module '@graphql-ez/koa' {
  interface EnvelopContext extends InferFunctionReturn<typeof buildContext> {}
}

export const { registerModule, buildApp } = CreateApp({
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
        hello3(_root, _args, _ctx) {
          return 'zzz';
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

  ide: {
    altair: true,
    graphiql: {
      subscriptionsEndpoint: 'http://localhost:3000/graphql',
    },
  },
});

export { gql };
