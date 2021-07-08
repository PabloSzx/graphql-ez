import { BuildContextArgs, CreateApp, gql, InferContext } from '@graphql-ez/hapi';
import { ezAltairIDE } from '@graphql-ez/plugin-altair';
import { ezCodegen } from '@graphql-ez/plugin-codegen';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezGraphQLModules } from '@graphql-ez/plugin-modules';
import { ezScalars } from '@graphql-ez/plugin-scalars';
import { ezSchema } from '@graphql-ez/plugin-schema';
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
      ezGraphQLModules(),
      ezScalars({
        DateTime: 1,
      }),
      ezAltairIDE(),
      ezGraphiQLIDE(),
      ezWebSockets(),
      ezSchema({
        schema: {
          typeDefs: gql`
            type Query {
              hello3: String!
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
