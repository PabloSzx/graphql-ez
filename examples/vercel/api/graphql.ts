import { CreateApp } from '@graphql-ez/vercel';
import { ezSchema, gql } from '@graphql-ez/plugin-schema';

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

export default buildApp().apiHandler;
