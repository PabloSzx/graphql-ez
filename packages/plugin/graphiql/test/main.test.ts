import { CreateTestClient as CreateNextjsTestClient, GlobalTeardown, testApiHandler } from '@graphql-ez/nextjs-testing';
import { ezSchema } from '@graphql-ez/plugin-schema';
import {
  CommonSchema,
  EZContext,
  gql,
  startExpressServer,
  startFastifyServer,
  startHapiServer,
  startHTTPServer,
  startKoaServer,
} from 'graphql-ez-testing';
import { ezGraphiQLIDE, GraphiQLHandler } from '../src';

afterAll(GlobalTeardown);

test.only('fastify', async () => {
  const { request } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [
          ezGraphiQLIDE({
            path: '/graphiql',
          }),
        ],
      },
    },
  });

  expect(
    (
      await request({
        path: '/graphiql',
        method: 'GET',
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
    "
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=\\"utf-8\\" />
        <title>GraphiQL</title>
        <meta name=\\"robots\\" content=\\"noindex\\" />
        <meta name=\\"referrer\\" content=\\"origin\\" />
        <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />
        <link
          rel=\\"icon\\"
          type=\\"image"
  `);
});

test('fastify-same-path', async () => {
  const { request, query } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [
          ezGraphiQLIDE({
            path: '/graphql',
          }),
        ],
      },
    },
  });

  expect(
    (
      await request({
        path: '/graphql',
        method: 'GET',
        headers: {
          accept: 'text/html',
        },
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
    "
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=\\"utf-8\\" />
        <title>GraphiQL</title>
        <meta name=\\"robots\\" content=\\"noindex\\" />
        <meta name=\\"referrer\\" content=\\"origin\\" />
        <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />
        <link
          rel=\\"icon\\"
          type=\\"image"
  `);

  await expect(query('{hello}', { method: 'GET' })).resolves.toMatchInlineSnapshot(`
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

test('express', async () => {
  const { request } = await startExpressServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [
          ezGraphiQLIDE({
            path: '/graphiql',
          }),
        ],
      },
    },
  });

  expect(
    (
      await request({
        path: '/graphiql',
        method: 'GET',
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
    "
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=\\"utf-8\\" />
        <title>GraphiQL</title>
        <meta name=\\"robots\\" content=\\"noindex\\" />
        <meta name=\\"referrer\\" content=\\"origin\\" />
        <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />
        <link
          rel=\\"icon\\"
          type=\\"image"
  `);
});

test('express-same-path', async () => {
  const { request, query } = await startExpressServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [
          ezGraphiQLIDE({
            path: '/graphql',
          }),
        ],
      },
    },
  });

  expect(
    (
      await request({
        path: '/graphql',
        method: 'GET',
        headers: {
          accept: 'text/html',
        },
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
    "
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=\\"utf-8\\" />
        <title>GraphiQL</title>
        <meta name=\\"robots\\" content=\\"noindex\\" />
        <meta name=\\"referrer\\" content=\\"origin\\" />
        <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />
        <link
          rel=\\"icon\\"
          type=\\"image"
  `);

  await expect(query('{hello}', { method: 'GET' })).resolves.toMatchInlineSnapshot(`
          Object {
            "data": Object {
              "hello": "Hello World!",
            },
            "http": Object {
              "headers": Object {
                "connection": "keep-alive",
                "content-length": "33",
                "content-type": "application/json; charset=utf-8",
                "etag": "W/\\"21-8RkOxzVx9fQUGIol7Im263Gc/34\\"",
                "keep-alive": "timeout=5",
                "x-powered-by": "Express",
              },
              "statusCode": 200,
            },
          }
        `);
});

test('http', async () => {
  const { request } = await startHTTPServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [
          ezGraphiQLIDE({
            path: '/graphiql',
          }),
        ],
      },
    },
  });

  expect(
    (
      await request({
        path: '/graphiql',
        method: 'GET',
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
    "
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=\\"utf-8\\" />
        <title>GraphiQL</title>
        <meta name=\\"robots\\" content=\\"noindex\\" />
        <meta name=\\"referrer\\" content=\\"origin\\" />
        <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />
        <link
          rel=\\"icon\\"
          type=\\"image"
  `);
});

test('http-same-path', async () => {
  const { request, query } = await startHTTPServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [
          ezGraphiQLIDE({
            path: '/graphql',
          }),
        ],
      },
    },
  });

  expect(
    (
      await request({
        path: '/graphql',
        method: 'GET',
        headers: {
          accept: 'text/html',
        },
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
    "
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=\\"utf-8\\" />
        <title>GraphiQL</title>
        <meta name=\\"robots\\" content=\\"noindex\\" />
        <meta name=\\"referrer\\" content=\\"origin\\" />
        <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />
        <link
          rel=\\"icon\\"
          type=\\"image"
  `);

  await expect(query('{hello}', { method: 'GET' })).resolves.toMatchInlineSnapshot(`
          Object {
            "data": Object {
              "hello": "Hello World!",
            },
            "http": Object {
              "headers": Object {
                "connection": "keep-alive",
                "content-type": "application/json",
                "keep-alive": "timeout=5",
                "transfer-encoding": "chunked",
              },
              "statusCode": 200,
            },
          }
        `);
});

test('hapi', async () => {
  const { request } = await startHapiServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [
          ezGraphiQLIDE({
            path: '/graphiql',
          }),
        ],
      },
    },
  });

  expect(
    (
      await request({
        path: '/graphiql',
        method: 'GET',
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
    "
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=\\"utf-8\\" />
        <title>GraphiQL</title>
        <meta name=\\"robots\\" content=\\"noindex\\" />
        <meta name=\\"referrer\\" content=\\"origin\\" />
        <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />
        <link
          rel=\\"icon\\"
          type=\\"image"
  `);
});
test('hapi-same-path', async () => {
  const { request, query } = await startHapiServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [
          ezGraphiQLIDE({
            path: '/graphql',
          }),
        ],
      },
    },
  });

  expect(
    (
      await request({
        path: '/graphql',
        method: 'GET',
        headers: {
          accept: 'text/html',
        },
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
    "
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=\\"utf-8\\" />
        <title>GraphiQL</title>
        <meta name=\\"robots\\" content=\\"noindex\\" />
        <meta name=\\"referrer\\" content=\\"origin\\" />
        <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />
        <link
          rel=\\"icon\\"
          type=\\"image"
  `);

  await expect(query('{hello}', { method: 'GET' })).resolves.toMatchInlineSnapshot(`
          Object {
            "data": Object {
              "hello": "Hello World!",
            },
            "http": Object {
              "headers": Object {
                "accept-ranges": "bytes",
                "cache-control": "no-cache",
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

test('koa', async () => {
  const { request } = await startKoaServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [
          ezGraphiQLIDE({
            path: '/graphiql',
          }),
        ],
      },
    },
  });

  expect(
    (
      await request({
        path: '/graphiql',
        method: 'GET',
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
    "
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=\\"utf-8\\" />
        <title>GraphiQL</title>
        <meta name=\\"robots\\" content=\\"noindex\\" />
        <meta name=\\"referrer\\" content=\\"origin\\" />
        <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />
        <link
          rel=\\"icon\\"
          type=\\"image"
  `);
});
test('koa-same-path', async () => {
  const { request, query } = await startKoaServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [
          ezGraphiQLIDE({
            path: '/graphql',
          }),
        ],
      },
    },
  });

  expect(
    (
      await request({
        path: '/graphql',
        method: 'GET',
        headers: {
          accept: 'text/html',
        },
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
    "
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=\\"utf-8\\" />
        <title>GraphiQL</title>
        <meta name=\\"robots\\" content=\\"noindex\\" />
        <meta name=\\"referrer\\" content=\\"origin\\" />
        <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />
        <link
          rel=\\"icon\\"
          type=\\"image"
  `);

  await expect(query('{hello}', { method: 'GET' })).resolves.toMatchInlineSnapshot(`
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

test('nextjs', async () => {
  function buildContext(_args: import('@graphql-ez/nextjs').BuildContextArgs) {
    return {
      foo: 'bar',
    };
  }

  const { testFetch, query } = await CreateNextjsTestClient({
    buildContext,
    ez: {
      plugins: [
        ezGraphiQLIDE({
          path: '/graphiql',
        }),
        ezSchema({
          schema: {
            typeDefs: gql`
              type Query {
                hello: String!
                context: String!
              }
            `,
            resolvers: {
              Query: {
                hello() {
                  return 'Hello World!';
                },
                context(_root: unknown, _args: unknown, { req, ...ctx }: EZContext) {
                  return JSON.stringify(ctx);
                },
              },
            },
          },
        }),
      ],
    },
  });

  expect(
    (
      await (
        await testFetch({
          method: 'GET',
          headers: {
            accept: 'text/html',
          },
        })
      ).text()
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
    "
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=\\"utf-8\\" />
        <title>GraphiQL</title>
        <meta name=\\"robots\\" content=\\"noindex\\" />
        <meta name=\\"referrer\\" content=\\"origin\\" />
        <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />
        <link
          rel=\\"icon\\"
          type=\\"image"
  `);

  expect(await query('{hello}')).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "hello": "Hello World!",
      },
    }
  `);

  await testApiHandler({
    async handler(req, res) {
      await GraphiQLHandler({
        endpoint: '/api/graphql',
      })(req, res);
    },
    async test({ fetch }) {
      expect(
        (
          await (
            await fetch({
              method: 'GET',
            })
          ).text()
        ).slice(0, 300)
      ).toMatchInlineSnapshot(`
        "
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset=\\"utf-8\\" />
            <title>GraphiQL</title>
            <meta name=\\"robots\\" content=\\"noindex\\" />
            <meta name=\\"referrer\\" content=\\"origin\\" />
            <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />
            <link
              rel=\\"icon\\"
              type=\\"image"
      `);
    },
  });
});
