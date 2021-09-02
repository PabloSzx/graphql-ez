import { App } from '@tinyhttp/app';
import { logger } from '@tinyhttp/logger';
import { ezSchema, gql } from '@graphql-ez/plugin-schema';
import { CreateApp } from '@graphql-ez/tinyhttp';

const app = new App();

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

app.use(logger());

await ezApp.buildApp({
  app,
});

app.listen(3000);
