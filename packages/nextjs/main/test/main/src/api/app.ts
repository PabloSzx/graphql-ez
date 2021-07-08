import { ezSchema } from '@graphql-ez/plugin-schema';

import { CreateApp, EZContext, gql } from '../../../../src';

function buildContext(_args: import('../../../../src').BuildContextArgs) {
  return {
    foo: 'bar',
  };
}

export const { buildApp } = CreateApp({
  buildContext,
  ez: {
    plugins: [
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
