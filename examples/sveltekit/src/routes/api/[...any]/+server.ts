import { CreateApp, type SvelteKitContextArgs } from '@graphql-ez/sveltekit';
import { ezSchema, gql } from '@graphql-ez/plugin-schema';
import { ezVoyager } from '@graphql-ez/plugin-voyager';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezUnpkgAltairIDE } from '@graphql-ez/plugin-altair/unpkg';

const buildContext = ({ sveltekit }: SvelteKitContextArgs) => {
  console.log(sveltekit);
  return {};
};

const ezApp = CreateApp({
  path: '/api/graphql',
  ez: {
    plugins: [
      ezVoyager({
        path: '/api/voyager',
      }),
      ezUnpkgAltairIDE({
        path: '/api/altair',
        instanceStorageNamespace: 'sveltekit',
      }),
      ezGraphiQLIDE(),
      ezSchema({
        schema: {
          typeDefs: gql`
            type Query {
              hello: String!
            }
          `,
          resolvers: {
            Query: {
              hello(_root, _args, _ctx) {
                return 'Hello World!';
              },
            },
          },
        },
      }),
    ],
  },
  buildContext,
});

const { handler } = ezApp.buildApp();

export const GET = handler;

export const POST = handler;
