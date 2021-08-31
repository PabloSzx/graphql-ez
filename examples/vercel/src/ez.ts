import { CreateApp } from '@graphql-ez/vercel';
import { ezSchema, gql } from '@graphql-ez/plugin-schema';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';

export const ezApp = CreateApp({
  ez: {
    plugins: [
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
