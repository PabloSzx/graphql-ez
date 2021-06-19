import Fastify from 'fastify';

import { CreateApp, gql } from '@graphql-ez/fastify-new';
import { ezAltairIDE } from '@graphql-ez/plugin-altair';
import { ezCodegen } from '@graphql-ez/plugin-codegen';
import { ezGraphQLModules } from '@graphql-ez/plugin-modules';
import { ezScalars } from '@graphql-ez/plugin-scalars';
import { ezUpload } from '@graphql-ez/plugin-upload';

const app = Fastify({
  logger: true,
});

const EZApp = CreateApp({
  schema: {
    typeDefs: gql`
      type Query {
        hello: String!
      }
    `,
    resolvers: {
      Query: {
        hello() {
          return 'hello world';
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

app.listen(3030);
