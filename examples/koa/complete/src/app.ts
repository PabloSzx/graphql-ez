import { BuildContextArgs, CreateApp, gql, InferContext, readStreamToBuffer } from '@graphql-ez/koa';
import { ezAltairIDE } from '@graphql-ez/plugin-altair';
import { ezCodegen } from '@graphql-ez/plugin-codegen';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezGraphQLModules } from '@graphql-ez/plugin-modules';
import { ezScalars } from '@graphql-ez/plugin-scalars';
import { ezSchema } from '@graphql-ez/plugin-schema';
import { ezUpload } from '@graphql-ez/plugin-upload';
import { ezWebSockets } from '@graphql-ez/plugin-websockets';
import { ezSSE } from '@graphql-ez/plugin-sse';

function buildContext({ req }: BuildContextArgs) {
  return {
    req,
    foo: 'bar',
  };
}

declare module 'graphql-ez' {
  interface EZContext extends InferContext<typeof buildContext> {}
}

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

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
          documents: 'src/graphql/*',
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
      ezWebSockets(),
      ezSSE({
        options: {
          // ...
        },
        path: '/graphql/stream',
      }),
      ezSchema({
        schema: {
          typeDefs: gql`
            type Query {
              hello3: String!
            }
            type Mutation {
              uploadFileToBase64(file: Upload!): String!
            }
            type Subscription {
              hello: String!
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
      }),
    ],
  },
});

export { gql };
