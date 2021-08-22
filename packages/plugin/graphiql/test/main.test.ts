import { CreateTestClient as CreateNextjsTestClient, GlobalTeardown, testApiHandler } from '@graphql-ez/nextjs-testing';
import { ezSchema } from '@graphql-ez/plugin-schema';
import {
  CommonSchema,
  createDeferredPromise,
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

test('fastify', async () => {
  const { request } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [ezGraphiQLIDE()],
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

test('express', async () => {
  const { request } = await startExpressServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [ezGraphiQLIDE()],
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
  ).toMatchInlineSnapshot(
    `
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
  `
  );
});

test('http', async () => {
  const { request } = await startHTTPServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [ezGraphiQLIDE()],
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
  ).toMatchInlineSnapshot(
    `
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
  `
  );
});

test('hapi', async () => {
  const { request } = await startHapiServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [ezGraphiQLIDE()],
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
  ).toMatchInlineSnapshot(
    `
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
  `
  );
});

test('koa', async () => {
  const { request } = await startKoaServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [ezGraphiQLIDE()],
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
  ).toMatchInlineSnapshot(
    `
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
  `
  );
});

test('nextjs', async () => {
  const warnCalled = createDeferredPromise<unknown>(5000);

  const prevWarn = console.warn;
  const warnWatcher = (...message: unknown[]) => {
    if (typeof message[0] === 'string' && message[0].startsWith('[graphql-ez]')) {
      warnCalled.resolve(message);
    } else {
      prevWarn(...message);
    }
  };
  console.warn = warnWatcher;

  function buildContext(_args: import('@graphql-ez/nextjs').BuildContextArgs) {
    return {
      foo: 'bar',
    };
  }

  const { query } = await CreateNextjsTestClient({
    buildContext,
    ez: {
      plugins: [
        ezGraphiQLIDE(),
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

  expect(await query('{hello}')).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "hello": "Hello World!",
      },
    }
  `);

  expect(await warnCalled.promise).toMatchInlineSnapshot(`
    Array [
      "[graphql-ez] You don't need to add the GraphiQL plugin in your EZ App for Next.js, use \\"GraphiQLHandler\\" directly in your API Routes.",
    ]
  `);

  testApiHandler({
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
