import { CommonSchema } from 'graphql-ez-testing';

import { CreateApp } from '@graphql-ez/express';

import { CreateTestClient, GlobalTeardown } from '../src';

afterAll(GlobalTeardown);

test('from preset', async () => {
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

  const { default: express } = await import('express');

  const app = express();
  const builtApp = ezAppBuilder.buildApp({
    app,
  });

  const { query } = await CreateTestClient(builtApp, {
    app,
  });

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
