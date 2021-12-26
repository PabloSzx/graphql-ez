import { CreateTestClient, GlobalTeardown } from '@graphql-ez/fastify-testing';
import { ezSchema, gql } from '@graphql-ez/plugin-schema';
import { expect } from 'chai';

after(GlobalTeardown);

test('Hello World', async () => {
  const { assertedQuery } = await CreateTestClient({
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
          graphqlSchemaConfig: {
            enableDeferStream: true,
          },
        }),
      ],
    },
  });

  expect(
    await assertedQuery(gql`
      query {
        hello
      }
    `)
  ).to.deep.equals({
    hello: 'Hello World!',
  });
});
