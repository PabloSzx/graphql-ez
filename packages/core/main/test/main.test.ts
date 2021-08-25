import {
  CommonSchema,
  gql,
  makeExecutableSchema,
  PingSubscription,
  startFastifyServer,
  useSchema,
  expectCommonQueryStream,
  expectCommonServerSideEventSubscription,
} from 'graphql-ez-testing';

import { useExtendContext } from '@envelop/core';
import { CreateApp } from '@graphql-ez/fastify';
import { ezAltairIDE } from '@graphql-ez/plugin-altair';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezVoyager } from '@graphql-ez/plugin-voyager';

test.concurrent('basic', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
    },
  });

  expect(await query(`{hello}`)).toMatchInlineSnapshot(`
Object {
  "data": Object {
    "hello": "Hello World!",
  },
  "http": Object {
    "headers": Object {
      "connection": "keep-alive",
      "content-length": "33",
      "content-type": "application/json; charset=utf-8",
      "keep-alive": "timeout=5",
    },
    "statusCode": 200,
  },
}
`);
});

test.concurrent('batched queries', async () => {
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
    Array [
      Object {
        "data": Object {
          "hello": "Hello World!",
        },
      },
      Object {
        "data": Object {
          "hello": "Hello World!",
        },
      },
    ]
  `);
});

test.concurrent('query with @stream', async () => {
  const { address } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema],
    },
  });

  await expectCommonQueryStream(address);
});

test.concurrent('SSE subscription', async () => {
  const { address } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema, PingSubscription.schema],
    },
  });

  await expectCommonServerSideEventSubscription(address);
});

test.concurrent('no schema', async () => {
  await expect(startFastifyServer({})).rejects.toMatchInlineSnapshot(`[Error: [graphql-ez] No GraphQL Schema specified!]`);
});

test.concurrent('external schema', async () => {
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

test.concurrent('presets', async () => {
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
Array [
  Object {
    "compatibilityList": Array [
      "fastify",
      "koa",
      "express",
      "hapi",
      "http",
      "nextjs",
    ],
    "name": "GraphiQL IDE",
    "onIntegrationRegister": [Function],
    "onRegister": [Function],
  },
]
`);

  expect(envelopPlugins).toMatchInlineSnapshot(`
Array [
  Object {
    "onContextBuilding": [Function],
  },
]
`);

  expect(asPreset.ezPlugins).toMatchInlineSnapshot(`
Array [
  Object {
    "compatibilityList": Array [
      "fastify",
      "koa",
      "express",
      "hapi",
      "http",
      "nextjs",
    ],
    "name": "GraphiQL IDE",
    "onIntegrationRegister": [Function],
    "onRegister": [Function],
  },
]
`);

  envelopPlugins.push(useExtendContext(() => ({})));

  expect(ezPlugins).toMatchInlineSnapshot(`
Array [
  Object {
    "compatibilityList": Array [
      "fastify",
      "koa",
      "express",
      "hapi",
      "http",
      "nextjs",
    ],
    "name": "GraphiQL IDE",
    "onIntegrationRegister": [Function],
    "onRegister": [Function],
  },
]
`);
  expect(envelopPlugins).toMatchInlineSnapshot(`
Array [
  Object {
    "onContextBuilding": [Function],
  },
  Object {
    "onContextBuilding": [Function],
  },
]
`);
  expect(asPreset.ezPlugins).toMatchInlineSnapshot(`
Array [
  Object {
    "compatibilityList": Array [
      "fastify",
      "koa",
      "express",
      "hapi",
      "http",
      "nextjs",
    ],
    "name": "GraphiQL IDE",
    "onIntegrationRegister": [Function],
    "onRegister": [Function],
  },
]
`);
  expect(asPreset.envelopPlugins).toMatchInlineSnapshot(`
Array [
  Object {
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
Array [
  Object {
    "compatibilityList": Array [
      "fastify",
      "koa",
      "express",
      "hapi",
      "http",
      "nextjs",
    ],
    "name": "GraphQL Voyager",
    "onIntegrationRegister": [Function],
    "onRegister": [Function],
  },
  Object {
    "compatibilityList": Array [
      "fastify",
      "koa",
      "express",
      "hapi",
      "http",
      "nextjs",
    ],
    "name": "GraphiQL IDE",
    "onIntegrationRegister": [Function],
    "onRegister": [Function],
  },
]
`);

  expect(appBuilder.envelopPlugins).toMatchInlineSnapshot(`
Array [
  Object {
    "onContextBuilding": [Function],
  },
  Object {
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
