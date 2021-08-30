import { CreateApp, SvelteKitContextArgs } from '@graphql-ez/sveltekit';
import { ezSchema, gql } from '@graphql-ez/plugin-schema';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezAltairIDE } from '@graphql-ez/plugin-altair';
import { ezVoyager } from '@graphql-ez/plugin-voyager';
import { ezCodegen } from '@graphql-ez/plugin-codegen';

const buildContext = ({ sveltekit }: SvelteKitContextArgs<{ asd: string }, {}>) => {
  sveltekit.req.locals.asd;

  return {};
};

const ezApp = CreateApp({
  path: '/graphql',
  ez: {
    plugins: [
      ezCodegen({
        outputSchema: true,
      }),
      ezVoyager(),
      ezAltairIDE(),
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
