import { ezAltairIDE } from '@graphql-ez/plugin-altair';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezSchema, gql } from '@graphql-ez/plugin-schema';
import { ezVoyager } from '@graphql-ez/plugin-voyager';
import type {} from '@sveltejs/kit/types/endpoint';
import { CreateApp, SvelteKitContextArgs } from '../../../../src';

const buildContext = (_args: SvelteKitContextArgs) => {
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

export const get = handler;

export const post = handler;
