import { ezAltairIDE } from '@graphql-ez/plugin-altair';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezSchema, gql } from '@graphql-ez/plugin-schema';
import { ezVoyager } from '@graphql-ez/plugin-voyager';
import { CreateApp, type SvelteKitContextArgs } from '../../../../../src';

const buildContext = (_args: SvelteKitContextArgs) => {
  console.log('here');
  return {
    foo: 'bar',
  };
};

const ezApp = CreateApp({
  path: '/graphql',
  ez: {
    plugins: [
      ezVoyager(),
      ezAltairIDE(),
      ezGraphiQLIDE(),
      ezSchema({
        schema: {
          typeDefs: gql`
            type Query {
              hello: String!
              ctx: String!
            }
          `,
          resolvers: {
            Query: {
              hello(_root, _args, _ctx) {
                return 'Hello World!';
              },
              ctx(_root, _args, { req, request, sveltekit, document, operation, ...ctx }) {
                return JSON.stringify(ctx, null, 2);
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
