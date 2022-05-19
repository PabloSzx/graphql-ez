import { CreateTestClient, GlobalTeardown } from '@graphql-ez/fastify-testing';
import SchemaBuilder from '@pothos/core';
import { expect } from 'chai';
import { gql } from 'graphql-ez';

after(GlobalTeardown);

test('Hello World', async () => {
  const builder = new SchemaBuilder({});

  builder.queryType({});

  builder.queryField('hello', t =>
    t.string({
      resolve() {
        return 'Hello World!';
      },
    })
  );

  const { assertedQuery } = await CreateTestClient({
    schema: builder.toSchema({}),
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
