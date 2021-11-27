import { CreateApp, SvelteKitContextArgs } from '@graphql-ez/sveltekit';
import { ezSchema, gql } from '@graphql-ez/plugin-schema';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezUnpkgAltairIDE } from '@graphql-ez/plugin-altair/unpkg';
import { ezVoyager } from '@graphql-ez/plugin-voyager';
import { ezCodegen } from '@graphql-ez/plugin-codegen';

const buildContext = ({ sveltekit }: SvelteKitContextArgs<{ asd: string }, {}>) => {
  sveltekit.req.locals.asd;

  return {};
};

const ezApp = CreateApp({
  path: '/api/graphql',
  ez: {
    plugins: [
      ezCodegen({
        outputSchema: true,
      }),
      ezVoyager(),
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

export const get = handler;

export const post = handler;
