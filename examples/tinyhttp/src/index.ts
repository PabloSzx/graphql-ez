import { App } from '@tinyhttp/app';
import { logger } from '@tinyhttp/logger';
import { ezSchema, gql } from '@graphql-ez/plugin-schema';
import { CreateApp } from '@graphql-ez/tinyhttp';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezAltairIDE } from '@graphql-ez/plugin-altair';
import { ezVoyager } from '@graphql-ez/plugin-voyager';
import { ezWebSockets } from '@graphql-ez/plugin-websockets';
const app = new App();

const ezApp = CreateApp({
  ez: {
    plugins: [
      ezWebSockets(),
      ezVoyager(),
      ezAltairIDE(),
      ezGraphiQLIDE(),
      ezSchema({
        schema: {
          typeDefs: gql`
            type Query {
              hello: String!
            }
            type Subscription {
              hello: String!
            }
          `,
          resolvers: {
            Query: {
              hello() {
                return 'Hello World!';
              },
            },
            Subscription: {
              hello: {
                async *subscribe() {
                  yield {
                    hello: 'hello1',
                  };

                  await sleep(300);

                  yield {
                    hello: 'hello2',
                  };

                  await sleep(300);

                  yield {
                    hello: 'hello3',
                  };
                },
              },
            },
          },
        },
      }),
    ],
  },
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

app.use(logger());

await ezApp.buildApp({
  app,
});

app.listen(3000);
