import { BuildContextArgs, CreateApp, InferContext } from '@graphql-ez/cloudflare';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezSchema, gql } from '@graphql-ez/plugin-schema';
import { listen } from 'worktop/cache';

function buildContext({ req, cloudflare }: BuildContextArgs) {
  // IncomingMessage-like
  req;

  // ServerRequest
  cloudflare!.req;

  return {
    foo: 'bar',
  };
}

// This snippet allows you to infer the context returned by your 'buildContext' and add it to the EZContext interface
declare module 'graphql-ez' {
  interface EZContext extends InferContext<typeof buildContext> {}
}

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
      ezGraphiQLIDE(),
    ],
  },
  buildContext,
  cors: true,
});

const { router } = buildApp();

router.add('GET', '/', (_req, res) => {
  res.send(200, { hello: 'Hello World!' });
});

listen(router.run);
