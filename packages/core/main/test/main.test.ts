import EventSource from 'eventsource';
import got from 'got';
import { CommonSchema, gql, makeExecutableSchema, PingSubscription, startFastifyServer, useSchema } from 'graphql-ez-testing';

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

  const stream = got.stream.post(`${address}/graphql`, {
    json: {
      query: `
        query {
          stream @stream(initialCount: 1)
        }
        `,
    },
  });

  try {
    const chunks: string[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk.toString());
    }
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toContain(`{"data":{"stream":["A"]},"hasNext":true}`);
    expect(chunks[1]).toContain(`{"data":"B","path":["stream",1],"hasNext":true}`);
    expect(chunks[2]).toContain(`{"data":"C","path":["stream",2],"hasNext":true}`);
  } catch (err) {
    stream.destroy();
    throw err;
  }
});

test.concurrent('SSE subscription', async () => {
  const { address } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema.schema, PingSubscription.schema],
    },
  });

  const eventSource = new EventSource(`${address}/graphql?query=subscription{ping}`);

  let n = 0;
  const payload = await new Promise<string>(resolve => {
    eventSource.addEventListener('message', (event: any) => {
      switch (++n) {
        case 1:
          return expect(JSON.parse(event.data)).toStrictEqual({
            data: {
              ping: 'pong1',
            },
          });
        case 2:
          return expect(JSON.parse(event.data)).toStrictEqual({
            data: {
              ping: 'pong2',
            },
          });
        case 3:
          expect(JSON.parse(event.data)).toStrictEqual({
            data: {
              ping: 'pong3',
            },
          });
          return resolve('OK');
        default:
          console.error(event);
          throw Error('Unexpected event');
      }
    });
  }).catch(err => {
    eventSource.close();
    throw err;
  });
  eventSource.close();
  expect(payload).toBe('OK');
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
      plugins: [ezGraphiQLIDE()],
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

  ezPlugins.push(ezAltairIDE());
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
  Object {
    "compatibilityList": Array [
      "fastify",
      "express",
      "hapi",
      "http",
      "koa",
      "nextjs",
    ],
    "name": "Altair GraphQL Client IDE",
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
