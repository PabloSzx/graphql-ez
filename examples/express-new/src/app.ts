import { BuildContextArgs, CreateApp, gql, InferFunctionReturn, readStreamToBuffer } from '@graphql-ez/express-new';
import { ezAltairIDE } from '@graphql-ez/plugin-altair';
import { ezCodegen } from '@graphql-ez/plugin-codegen';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezGraphQLModules } from '@graphql-ez/plugin-modules';
import { ezScalars } from '@graphql-ez/plugin-scalars';
import { ezUpload } from '@graphql-ez/plugin-upload';

function buildContext({ req }: BuildContextArgs) {
  return {
    req,
    foo: 'bar',
  };
}

declare module '@graphql-ez/express-new' {
  interface EnvelopContext extends InferFunctionReturn<typeof buildContext> {}
}

export const { registerModule, buildApp } = CreateApp({
  buildContext,
  ez: {
    plugins: [
      ezCodegen({
        config: {
          federation: true,
          deepPartialResolvers: true,
          targetPath: './src/ez.generated.ts',
          scalars: {
            DateTime: 'string',
          },
        },
        outputSchema: './schema.gql',
      }),
      ezUpload(),
      ezGraphQLModules(),
      ezScalars({
        DateTime: 1,
      }),
      ezAltairIDE(),
      ezGraphiQLIDE(),
    ],
  },

  schema: {
    typeDefs: gql`
      type Mutation {
        uploadFileToBase64(file: Upload!): String!
      }
    `,
    resolvers: {
      Mutation: {
        async uploadFileToBase64(_root, { file }) {
          const fileBuffer = await readStreamToBuffer(file);

          return fileBuffer.toString('base64');
        },
      },
    },
  },
});

export { gql };
