import { listen } from 'worktop/cache';

import { ezSchema, gql } from '@graphql-ez/plugin-schema';

import { CreateApp } from '../../src';

const { buildApp } = CreateApp({
  ez: {
    plugins: [
      ezSchema({
        schema: {
          typeDefs: gql`
            type Query {
              hello: String!
            }
          `,
          resolvers: {
            Query: {
              hello() {
                return 'Hello World!';
              },
            },
          },
        },
      }),
    ],
  },
});

const { router } = buildApp();

listen(router.run);
