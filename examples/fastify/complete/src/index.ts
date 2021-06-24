import Fastify from 'fastify';

import { CreateApp, gql } from '@graphql-ez/fastify';
import { ezAltairIDE } from '@graphql-ez/plugin-altair';
import { ezCodegen } from '@graphql-ez/plugin-codegen';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezGraphQLModules } from '@graphql-ez/plugin-modules';
import { ezScalars } from '@graphql-ez/plugin-scalars';
import { ezUpload } from '@graphql-ez/plugin-upload';
import { ezWebSockets } from '@graphql-ez/plugin-websockets';

const app = Fastify({
  logger: true,
});

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const EZApp = CreateApp({
  schema: {
    typeDefs: gql`
      type Query {
        hello: String!
        file: Upload
      }
      type Subscription {
        hello: String!
      }
    `,
    resolvers: {
      Query: {
        hello() {
          return 'hello world';
        },
      },
      Subscription: {
        hello: {
          async *subscribe(_root, _args, _ctx) {
            for (let i = 1; i <= 5; ++i) {
              await sleep(500);

              yield {
                hello: 'Hello World ' + i,
              };
            }
            yield {
              hello: 'Done!',
            };
          },
        },
      },
    },
  },
  cache: true,
  ez: {
    plugins: [
      ezCodegen({
        outputSchema: true,
      }),
      ezUpload(),
      ezScalars('*'),
      ezAltairIDE(),
      ezGraphQLModules(),
      ezGraphiQLIDE(),
      ezWebSockets('adaptive'),
    ],
  },
});

EZApp.registerModule(gql`
  type Query {
    other: String!
  }
`);

app.register(EZApp.buildApp().fastifyPlugin);

app.ready(err => {
  if (!err) return;

  console.error(err);
  process.exit(1);
});

app.listen(process.env.PORT || 3000);
