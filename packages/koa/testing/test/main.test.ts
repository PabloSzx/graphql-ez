import { CreateApp } from '@graphql-ez/koa';
import KoaRouter from '@koa/router';
import { CommonSchema } from 'graphql-ez-testing';
import Koa from 'koa';
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

  const app = new Koa();
  const router = new KoaRouter();
  const builtApp = ezAppBuilder.buildApp({
    app,
    router,
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
