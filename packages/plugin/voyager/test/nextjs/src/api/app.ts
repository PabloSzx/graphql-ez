import { CreateApp, gql, EZContext } from '@graphql-ez/nextjs';
import { ezSchema } from '@graphql-ez/plugin-schema';

import { ezVoyager } from '../../../../src';

function buildContext(_args: import('@graphql-ez/nextjs').BuildContextArgs) {
  return {
    foo: 'bar',
  };
}

export const { buildApp } = CreateApp({
  buildContext,
  ez: {
    plugins: [
      ezVoyager(),
      ezSchema({
        schema: {
          typeDefs: gql`
            type Query {
              hello: String!
              context: String!
            }
          `,
          resolvers: {
            Query: {
              hello() {
                return 'Hello World!';
              },
              context(_root: unknown, _args: unknown, { req, ...ctx }: EZContext) {
                return JSON.stringify(ctx);
              },
            },
          },
        },
      }),
    ],
  },
});
