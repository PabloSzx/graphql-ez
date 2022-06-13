import {
  CommonSchema,
  gql,
  makeExecutableSchema,
  PingSubscription,
  startFastifyServer,
  useSchema,
  expectCommonQueryStream,
  expectCommonServerSideEventSubscription,
  testIfStreamDefer,
} from 'graphql-ez-testing';

import { useExtendContext } from '@envelop/core';
import { CreateApp } from '@graphql-ez/fastify';
import { ezAltairIDE } from '@graphql-ez/plugin-altair';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezVoyager } from '@graphql-ez/plugin-voyager';
import { GraphQLSchema } from 'graphql';

test('basic', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
    },
  });

  expect(await query(`{hello}`)).toMatchInlineSnapshot(`
    {
      "data": {
        "hello": "Hello World!",
      },
      "http": {
        "headers": {
          "connection": "keep-alive",
          "content-length": "33",
          "content-type": "application/json; charset=utf-8",
          "keep-alive": "timeout=72",
        },
        "statusCode": 200,
      },
    }
  `);
});

test('batched queries', async () => {
  const { request } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
      cache: true,
      allowBatchedQueries: true,
    },
  });

  expect(
    JSON.parse(
      await request({
        method: 'POST',
        path: '/graphql',
        body: JSON.stringify([
          {
            query: `{hello}`,
          },

          {
            query: `{hello}`,
          },
        ]),

        headers: {
          'content-type': 'application/json',
        },
      })
    )
  ).toMatchInlineSnapshot(`
    [
      {
        "data": {
          "hello": "Hello World!",
        },
      },
      {
        "data": {
          "hello": "Hello World!",
        },
      },
    ]
  `);
});

testIfStreamDefer('query with @stream', async () => {
  const { address } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
      transformFinalSchema(schema) {
        return new GraphQLSchema({
          ...schema.toConfig(),
          enableDeferStream: true,
        });
      },
    },
  });

  await expectCommonQueryStream(address);
});

test('SSE subscription', async () => {
  const { address } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema, PingSubscription.schema],
    },
  });

  await expectCommonServerSideEventSubscription(address);
});

test('no schema', async () => {
  await expect(startFastifyServer({})).rejects.toMatchInlineSnapshot(
    `[Error: [graphql-ez] No GraphQL Schema specified!. If you are using a dynamic schema, make sure to set the "schema" configuration property as "dynamic".]`
  );
});

test('external schema', async () => {
  const schema = makeExecutableSchema({
    typeDefs: gql`
      type Query {
        ok: String!
      }
    `,
    resolvers: {
      Query: {
        ok(_root, _args, _ctx) {
          return 'OK';
        },
      },
    },
  });
  const { query } = await startFastifyServer({
    createOptions: {
      envelop: {
        plugins: [useSchema(schema)],
      },
    },
  });

  expect((await query<{ ok: string }>('{ok}')).data?.ok).toBe('OK');
});

test('presets', async () => {
  const schema = makeExecutableSchema({
    typeDefs: gql`
      type Query {
        ok: String!
      }
    `,
    resolvers: {
      Query: {
        ok(_root, _args, _ctx) {
          return 'OK';
        },
      },
    },
  });
  const { asPreset, ezPlugins, envelopPlugins } = CreateApp({
    schema,
    ez: {
      plugins: [
        ezGraphiQLIDE({
          path: '/graphiql',
        }),
      ],
    },
    envelop: {
      plugins: [useExtendContext(() => ({}))],
    },
  });

  expect(ezPlugins).toMatchInlineSnapshot(`
    [
      {
        "compatibilityList": {
          "cloudflare": true,
          "express": true,
          "fastify": true,
          "hapi": true,
          "http": true,
          "koa": true,
          "nextjs": true,
          "sveltekit": true,
          "vercel": true,
        },
        "name": "GraphiQL IDE",
        "onIntegrationRegister": [Function],
        "onRegister": [Function],
      },
    ]
  `);

  expect(envelopPlugins).toMatchInlineSnapshot(`
    [
      {
        "onContextBuilding": [Function],
      },
    ]
  `);

  expect(asPreset.ezPlugins).toMatchInlineSnapshot(`
    [
      {
        "compatibilityList": {
          "cloudflare": true,
          "express": true,
          "fastify": true,
          "hapi": true,
          "http": true,
          "koa": true,
          "nextjs": true,
          "sveltekit": true,
          "vercel": true,
        },
        "name": "GraphiQL IDE",
        "onIntegrationRegister": [Function],
        "onRegister": [Function],
      },
    ]
  `);

  envelopPlugins.push(useExtendContext(() => ({})));

  expect(ezPlugins).toMatchInlineSnapshot(`
    [
      {
        "compatibilityList": {
          "cloudflare": true,
          "express": true,
          "fastify": true,
          "hapi": true,
          "http": true,
          "koa": true,
          "nextjs": true,
          "sveltekit": true,
          "vercel": true,
        },
        "name": "GraphiQL IDE",
        "onIntegrationRegister": [Function],
        "onRegister": [Function],
      },
    ]
  `);
  expect(envelopPlugins).toMatchInlineSnapshot(`
    [
      {
        "onContextBuilding": [Function],
      },
      {
        "onContextBuilding": [Function],
      },
    ]
  `);
  expect(asPreset.ezPlugins).toMatchInlineSnapshot(`
    [
      {
        "compatibilityList": {
          "cloudflare": true,
          "express": true,
          "fastify": true,
          "hapi": true,
          "http": true,
          "koa": true,
          "nextjs": true,
          "sveltekit": true,
          "vercel": true,
        },
        "name": "GraphiQL IDE",
        "onIntegrationRegister": [Function],
        "onRegister": [Function],
      },
    ]
  `);
  expect(asPreset.envelopPlugins).toMatchInlineSnapshot(`
    [
      {
        "onContextBuilding": [Function],
      },
    ]
  `);

  const { query, requestRaw, appBuilder } = await startFastifyServer({
    createOptions: {
      ez: {
        preset: asPreset,
        plugins: [ezVoyager()],
      },
    },
  });

  expect(appBuilder.ezPlugins).toMatchInlineSnapshot(`
    [
      {
        "compatibilityList": {
          "cloudflare": true,
          "express": true,
          "fastify": true,
          "hapi": true,
          "http": true,
          "koa": true,
          "nextjs": true,
          "sveltekit": true,
        },
        "name": "GraphQL Voyager",
        "onIntegrationRegister": [Function],
        "onRegister": [Function],
      },
      {
        "compatibilityList": {
          "cloudflare": true,
          "express": true,
          "fastify": true,
          "hapi": true,
          "http": true,
          "koa": true,
          "nextjs": true,
          "sveltekit": true,
          "vercel": true,
        },
        "name": "GraphiQL IDE",
        "onIntegrationRegister": [Function],
        "onRegister": [Function],
      },
    ]
  `);

  expect(appBuilder.envelopPlugins).toMatchInlineSnapshot(`
    [
      {
        "onContextBuilding": [Function],
      },
      {
        "onPluginInit": [Function],
      },
    ]
  `);

  expect(() => {
    // @ts-expect-error
    appBuilder.ezPlugins.push(ezAltairIDE());
  }).toThrowErrorMatchingInlineSnapshot(`"Cannot add property 2, object is not extensible"`);
  expect(() => {
    appBuilder.envelopPlugins.push(useExtendContext(() => ({})));
  }).toThrowErrorMatchingInlineSnapshot(`"Cannot add property 2, object is not extensible"`);

  expect((await query<{ ok: string }>('{ok}')).data?.ok).toBe('OK');

  expect(
    (
      await requestRaw({
        path: '/graphiql',
        method: 'GET',
      })
    ).statusCode
  ).toBe(200);

  expect(
    (
      await requestRaw({
        path: '/voyager',
        method: 'GET',
      })
    ).statusCode
  ).toBe(200);

  expect(
    (
      await requestRaw({
        path: '/other',
        method: 'GET',
      })
    ).statusCode
  ).toBe(404);
});
