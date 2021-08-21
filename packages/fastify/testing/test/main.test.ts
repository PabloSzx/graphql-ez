import { CommonSchema } from 'graphql-ez-testing';

import { CreateApp } from '@graphql-ez/fastify';

import { CreateTestClient, GlobalTeardown } from '../src';

afterAll(async () => {
  await GlobalTeardown;
});

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

test('from config', async () => {
  const { cleanup, query } = await CreateTestClient({
    schema: CommonSchema.schema,
  });

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

test('from built app', async () => {
  const ezAppBuilder = CreateApp({
    schema: CommonSchema.schema,
  });

  const builtApp = ezAppBuilder.buildApp();

  const { cleanup, query } = await CreateTestClient(builtApp);

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

test('detect invalid app', async () => {
  await expect(
    CreateTestClient({
      asPreset: undefined,
    } as any)
  ).rejects.toMatchInlineSnapshot(`[Error: Invalid EZ App]`);
});
