import { CommonSchema } from 'graphql-ez-testing';

import { CreateApp } from '@graphql-ez/hapi';

import { CreateTestClient, GlobalTeardown } from '../src';

afterAll(GlobalTeardown);

test.concurrent('from preset', async () => {
  const ezAppBuilder = CreateApp({
    schema: CommonSchema.schema,
  });

  const { cleanup, query } = await CreateTestClient(ezAppBuilder);

  try {
    await expect(query('{hello}')).resolves.toMatchInlineSnapshot(`
            Object {
              "data": Object {
                "hello": "Hello World!",
              },
            }
          `);
  } finally {
    await cleanup();
  }
});

test.concurrent('from config', async () => {
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

test.concurrent('from built app', async () => {
  const ezAppBuilder = CreateApp({
    schema: CommonSchema.schema,
  });

  const builtApp = ezAppBuilder.buildApp();

  const { query } = await CreateTestClient(builtApp);

  await expect(query('{hello}')).resolves.toMatchInlineSnapshot(`
                  Object {
                    "data": Object {
                      "hello": "Hello World!",
                    },
                  }
                `);
});

test.concurrent('detect invalid app', async () => {
  await expect(
    CreateTestClient({
      asPreset: undefined,
    } as any)
  ).rejects.toMatchInlineSnapshot(`[Error: Invalid EZ App]`);
});
