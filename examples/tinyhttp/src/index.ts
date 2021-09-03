import { ezAltairIDE } from '@graphql-ez/plugin-altair';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezSchema, gql } from '@graphql-ez/plugin-schema';
import { ezSSE } from '@graphql-ez/plugin-sse';
import { ezVoyager } from '@graphql-ez/plugin-voyager';
import { ezWebSockets } from '@graphql-ez/plugin-websockets';
import { BuildContextArgs, CreateApp, InferContext } from '@graphql-ez/tinyhttp';
import { App } from '@tinyhttp/app';
import { logger } from '@tinyhttp/logger';

function buildContext({ req, tinyhttp }: BuildContextArgs) {
  // IncomingMessage
  req;

  // Request | undefined
  tinyhttp?.req;

  return {
    foo: 'bar',
  };
}

declare module 'graphql-ez' {
  interface EZContext extends InferContext<typeof buildContext> {}
}

const app = new App();

const ezApp = CreateApp({
  ez: {
    plugins: [
      ezWebSockets(),
      ezVoyager(),
      ezAltairIDE(),
      ezGraphiQLIDE(),
      ezSSE(),
      ezSchema({
        schema: {
          typeDefs: gql`
            type Query {
              hello: String!
              ctx: String!
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
              ctx(_root, _args, { foo }) {
                return foo;
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
  buildContext,
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

app.use(logger());

ezApp
  .buildApp({
    app,
  })
  .then(() => {
    app.listen(3000);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
