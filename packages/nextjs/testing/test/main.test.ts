import { CommonSchema } from 'graphql-ez-testing';

import { CreateApp } from '@graphql-ez/nextjs';

import { CreateTestClient, GlobalTeardown } from '../src';

afterAll(GlobalTeardown);

test('from preset', async () => {
  const ezApp = CreateApp({
    schema: CommonSchema.schema,
  });

  const { query, schemaString } = await CreateTestClient(ezApp);

  await expect(query('{hello}')).resolves.toMatchInlineSnapshot(`
          Object {
            "data": Object {
              "hello": "Hello World!",
            },
          }
        `);

  expect(schemaString).toMatchInlineSnapshot(`
"type Query {
  hello: String!
  users: [User!]!
  stream: [String!]!
  context: String!
}

type User {
  id: Int!
}
"
`);
});

test('from config', async () => {
  const { query } = await CreateTestClient({
    schema: CommonSchema.schema,
  });

  await expect(query('{hello}')).resolves.toMatchInlineSnapshot(`
          Object {
            "data": Object {
              "hello": "Hello World!",
            },
          }
        `);
});

test.concurrent('from built app should throw', async () => {
  const ezAppBuilder = CreateApp({
    schema: CommonSchema.schema,
  });

  const builtApp = ezAppBuilder.buildApp({});

  await expect(CreateTestClient(builtApp as any)).rejects.toMatchInlineSnapshot(`[Error: Invalid EZ App]`);
});

test.concurrent('detect invalid app', async () => {
  await expect(
    CreateTestClient({
      asPreset: undefined,
    } as any)
  ).rejects.toMatchInlineSnapshot(`[Error: Invalid EZ App]`);
});
