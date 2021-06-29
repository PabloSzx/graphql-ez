import { BuildContextArgs, CreateApp, gql, InferContext, readStreamToBuffer } from '@graphql-ez/express';
import { ezAltairIDE } from '@graphql-ez/plugin-altair';
import { ezCodegen } from '@graphql-ez/plugin-codegen';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezGraphQLModules } from '@graphql-ez/plugin-modules';
import { ezScalars } from '@graphql-ez/plugin-scalars';
import { ezUpload } from '@graphql-ez/plugin-upload';
import { ezWebSockets } from '@graphql-ez/plugin-websockets';

function buildContext({ req }: BuildContextArgs) {
  return {
    req,
    foo: 'bar',
  };
}

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

declare module 'graphql-ez' {
  interface EZContext extends InferContext<typeof buildContext> {}
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
      ezWebSockets('adaptive'),
    ],
  },
  schema: {
    typeDefs: gql`
      type Mutation {
        uploadFileToBase64(file: Upload!): String!
      }
      type Subscription {
        hello: String!
      }
    `,
    resolvers: {
      Mutation: {
        async uploadFileToBase64(_root, { file }, _ctx) {
          const fileBuffer = await readStreamToBuffer(file);

          return fileBuffer.toString('base64');
        },
      },
      Subscription: {
        hello: {
          async *subscribe(_root, _args, _ctx) {
            for (let i = 1; i <= 5; ++i) {
              await sleep(500);

              yield {
                hello: 'Hello World ' + i,
              };
            }
            yield {
              hello: 'Done!',
            };
          },
        },
      },
    },
  },
});

export { gql };
