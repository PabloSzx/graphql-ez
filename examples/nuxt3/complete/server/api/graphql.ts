import { CreateApp } from '@graphql-ez/nuxt';
import { ezCodegen } from '@graphql-ez/plugin-codegen';
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
      ezCodegen(),
    ],
  },
});

const { apiHandler } = buildApp();

export default apiHandler;
