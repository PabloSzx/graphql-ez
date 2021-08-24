import { CreateApp } from '@graphql-ez/sveltekit';
import { ezSchema, gql } from '@graphql-ez/plugin-schema';

const ezApp = CreateApp({
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

const { handler } = ezApp.buildApp();

export const get = handler;

export const post = handler;
