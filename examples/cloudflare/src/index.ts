import { listen } from 'worktop/cache';
import { CreateApp } from '@graphql-ez/cloudflare';
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

const { router } = buildApp();

router.add('GET', '/', (_req, res) => {
  res.send(200, { hello: 'Hello World!' });
});

listen(router.run);
