import { BuildContextArgs, CreateApp, gql, InferContext, readStreamToBuffer } from '@graphql-ez/fastify';
import { ezAltairIDE } from '@graphql-ez/plugin-altair';
import { ezCodegen } from '@graphql-ez/plugin-codegen';
import { ezDataLoader } from '@graphql-ez/plugin-dataloader';
import { ezStaticGraphiQLIDE } from '@graphql-ez/plugin-graphiql/static';
import { ezGraphQLModules } from '@graphql-ez/plugin-modules';
import { ezScalars } from '@graphql-ez/plugin-scalars';
import { ezSchema } from '@graphql-ez/plugin-schema';
import { ezUpload } from '@graphql-ez/plugin-upload';
import { ezVoyager } from '@graphql-ez/plugin-voyager';
import { ezWebSockets } from '@graphql-ez/plugin-websockets';

function buildContext({ req }: BuildContextArgs) {
  return {
    req,
    foo: 'bar',
  };
}

declare module 'graphql-ez' {
  interface EZContext extends InferContext<typeof buildContext> {}
}

export const { registerModule, buildApp, registerDataLoader } = CreateApp({
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
      ezStaticGraphiQLIDE({
        path: '/graphql',
        hybridSubscriptionTransportConfig: {
          default: 'sse',
          config: {
            legacyWS: true,
            sse: true,
            transportWS: true,
          },
        },
      }),
      ezWebSockets('adaptive'),
      ezVoyager({
        displayOptions: {
          sortByAlphabet: true,
        },
        headers: {},
        credentials: 'include',
      }),
      ezDataLoader(),
      ezSchema({
        schema: {
          typeDefs: gql`
            type Mutation {
              uploadFileToBase64(file: Upload!): String!
            }
          `,
          resolvers: {
            Mutation: {
              async uploadFileToBase64(_root, { file }, _ctx) {
                const fileBuffer = await readStreamToBuffer(file);

                return fileBuffer.toString('base64');
              },
            },
          },
        },
      }),
    ],
  },
});

export { gql };
