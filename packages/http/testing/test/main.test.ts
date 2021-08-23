import { CreateApp } from '@graphql-ez/http';
import { CommonSchema } from 'graphql-ez-testing';
import { createServer } from 'http';
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

test.concurrent('from built app should throw', async () => {
  const ezAppBuilder = CreateApp({
    schema: CommonSchema.schema,
  });

  const server = createServer();
  const builtApp = ezAppBuilder.buildApp({
    server,
  });

  await expect(CreateTestClient(builtApp as any)).rejects.toMatchInlineSnapshot(`[Error: Invalid EZ App]`);
});

test.concurrent('detect invalid app', async () => {
  await expect(
    CreateTestClient({
      asPreset: undefined,
    } as any)
  ).rejects.toMatchInlineSnapshot(`[Error: Invalid EZ App]`);
});
