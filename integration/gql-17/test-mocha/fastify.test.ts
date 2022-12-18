import { CreateTestClient, GlobalTeardown } from '@graphql-ez/fastify-testing';
import { expect } from 'chai';
import { gql } from 'graphql-ez';
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

after(GlobalTeardown);

test('Hello World', async () => {
  const { assertedQuery } = await CreateTestClient({
    schema: new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields() {
          return {
            hello: {
              type: GraphQLString,
              resolve() {
                return 'Hello World!';
              },
            },
          };
        },
      }),
    }),
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
