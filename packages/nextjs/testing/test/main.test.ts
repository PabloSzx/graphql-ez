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
          {
            "data": {
              "hello": "Hello World!",
            },
          }
        `);

  expect(schemaString).toMatchInlineSnapshot(`
    "\\"\\"\\"
    Directs the executor to defer this fragment when the \`if\` argument is true or undefined.
    \\"\\"\\"
    directive @defer(
      \\"\\"\\"Deferred when true or undefined.\\"\\"\\"
      if: Boolean

      \\"\\"\\"Unique name\\"\\"\\"
      label: String
    ) on FRAGMENT_SPREAD | INLINE_FRAGMENT

    \\"\\"\\"
    Directs the executor to stream plural fields when the \`if\` argument is true or undefined.
    \\"\\"\\"
    directive @stream(
      \\"\\"\\"Stream when true or undefined.\\"\\"\\"
      if: Boolean

      \\"\\"\\"Unique name\\"\\"\\"
      label: String

      \\"\\"\\"Number of items to return immediately\\"\\"\\"
      initialCount: Int = 0
    ) on FIELD

    type Query {
      hello: String!
      users: [User!]!
      stream: [String!]
      context: String!
    }

    type User {
      id: Int!
    }"
  `);
});

test('from config', async () => {
  const { query } = await CreateTestClient({
    schema: CommonSchema.schema,
  });

  await expect(query('{hello}')).resolves.toMatchInlineSnapshot(`
          {
            "data": {
              "hello": "Hello World!",
            },
          }
        `);
});

test('from built app should throw', async () => {
  const ezAppBuilder = CreateApp({
    schema: CommonSchema.schema,
  });

  const builtApp = ezAppBuilder.buildApp({});

  await expect(CreateTestClient(builtApp as any)).rejects.toMatchInlineSnapshot(`[Error: Invalid EZ App]`);
});

test('detect invalid app', async () => {
  await expect(
    CreateTestClient({
      asPreset: undefined,
    } as any)
  ).rejects.toMatchInlineSnapshot(`[Error: Invalid EZ App]`);
});
