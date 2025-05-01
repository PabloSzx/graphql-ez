import { CreateTestClient as CreateNextjsTestClient, testApiHandler, GlobalTeardown } from '@graphql-ez/nextjs-testing';
import { ezSchema, gql } from '@graphql-ez/plugin-schema';
import {
  CommonSchema,
  createDeferredPromise,
  EZContext,
  startExpressServer,
  startFastifyServer,
  startHapiServer,
  startHTTPServer,
  startKoaServer,
} from 'graphql-ez-testing';
import { ezAltairIDE, ezUnpkgAltairIDE, UnpkgAltairHandler } from '../src';

afterAll(GlobalTeardown);

test('fastify', async () => {
  const { request } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [ezAltairIDE()],
      },
    },
  });

  expect(
    (
      await request({
        path: '/altair',
        method: 'GET',
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
   "<!DOCTYPE html>
   <html>
     <head>
       <meta charset="utf-8" />
       <title>Altair</title>
       <base href="/altair/">
       <meta name="viewport" content="width=device-width,initial-scale=1" />
       <link rel="icon" type="image/x-icon" href="favicon.ico" />
       <link href="styles.css" rel="stylesheet" />
    "
  `);

  expect(
    (
      await request({
        path: '/altair/styles.css',
        method: 'GET',
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(
    `".ant-alert,body,h1,h2,h3,h4,h5,h6{color:#000000d9}a,a:active,a:focus,a:hover{outline:0;text-decoration:none}dl,h1,h2,h3,h4,h5,h6,ol,p,pre,ul{margin-top:0}address,dl,ol,p,pre,ul{margin-bottom:1em}.ant-btn,[role=button],a,area,button,input:not([type=range]),label,select,summary,textarea{touch-action:m"`
  );
});

test('express', async () => {
  const { request } = await startExpressServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [ezAltairIDE()],
      },
    },
  });

  expect(
    (
      await request({
        path: '/altair',
        method: 'GET',
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
   "<!DOCTYPE html>
   <html>
     <head>
       <meta charset="utf-8" />
       <title>Altair</title>
       <base href="/altair/">
       <meta name="viewport" content="width=device-width,initial-scale=1" />
       <link rel="icon" type="image/x-icon" href="favicon.ico" />
       <link href="styles.css" rel="stylesheet" />
    "
  `);

  expect(
    (
      await request({
        path: '/altair/styles.css',
        method: 'GET',
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(
    `".ant-alert,body,h1,h2,h3,h4,h5,h6{color:#000000d9}a,a:active,a:focus,a:hover{outline:0;text-decoration:none}dl,h1,h2,h3,h4,h5,h6,ol,p,pre,ul{margin-top:0}address,dl,ol,p,pre,ul{margin-bottom:1em}.ant-btn,[role=button],a,area,button,input:not([type=range]),label,select,summary,textarea{touch-action:m"`
  );
});

test('http', async () => {
  const { request } = await startHTTPServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [ezAltairIDE()],
      },
    },
  });

  expect(
    (
      await request({
        path: '/altair',
        method: 'GET',
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
   "<!DOCTYPE html>
   <html>
     <head>
       <meta charset="utf-8" />
       <title>Altair</title>
       <base href="/altair/">
       <meta name="viewport" content="width=device-width,initial-scale=1" />
       <link rel="icon" type="image/x-icon" href="favicon.ico" />
       <link href="styles.css" rel="stylesheet" />
    "
  `);

  expect(
    (
      await request({
        path: '/altair/styles.css',
        method: 'GET',
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(
    `".ant-alert,body,h1,h2,h3,h4,h5,h6{color:#000000d9}a,a:active,a:focus,a:hover{outline:0;text-decoration:none}dl,h1,h2,h3,h4,h5,h6,ol,p,pre,ul{margin-top:0}address,dl,ol,p,pre,ul{margin-bottom:1em}.ant-btn,[role=button],a,area,button,input:not([type=range]),label,select,summary,textarea{touch-action:m"`
  );
});

test('hapi', async () => {
  const { request } = await startHapiServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [ezAltairIDE()],
      },
    },
  });

  expect(
    (
      await request({
        path: '/altair',
        method: 'GET',
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
    "<!doctype html>
    <html>

    <head>
      <meta charset="utf-8">
      <title>Altair</title>
      <base href="/altair/">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <link rel="icon" type="image/x-icon" href="favicon.ico">
      <link href="styles.css" rel="stylesheet" />
    </head>

    <body>
      <a"
  `);

  expect(
    (
      await request({
        path: '/altair/styles.css',
        method: 'GET',
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(
    `"[class^=ant-]::-ms-clear,[class*=ant-]::-ms-clear,[class^=ant-] input::-ms-clear,[class*=ant-] input::-ms-clear,[class^=ant-] input::-ms-reveal,[class*=ant-] input::-ms-reveal{display:none}html,body{width:100%;height:100%}input::-ms-clear,input::-ms-reveal{display:none}*,*:before,*:after{box-sizing:"`
  );
});

test('koa', async () => {
  const { request } = await startKoaServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [ezAltairIDE()],
      },
    },
  });

  expect(
    (
      await request({
        path: '/altair',
        method: 'GET',
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(`
   "<!DOCTYPE html>
   <html>
     <head>
       <meta charset="utf-8" />
       <title>Altair</title>
       <base href="/altair/">
       <meta name="viewport" content="width=device-width,initial-scale=1" />
       <link rel="icon" type="image/x-icon" href="favicon.ico" />
       <link href="styles.css" rel="stylesheet" />
    "
  `);

  expect(
    (
      await request({
        path: '/altair/styles.css',
        method: 'GET',
      })
    ).slice(0, 300)
  ).toMatchInlineSnapshot(
    `".ant-alert,body,h1,h2,h3,h4,h5,h6{color:#000000d9}a,a:active,a:focus,a:hover{outline:0;text-decoration:none}dl,h1,h2,h3,h4,h5,h6,ol,p,pre,ul{margin-top:0}address,dl,ol,p,pre,ul{margin-bottom:1em}.ant-btn,[role=button],a,area,button,input:not([type=range]),label,select,summary,textarea{touch-action:m"`
  );
});

test.skip('nextjs', async () => {
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

  const unpkgHandler = UnpkgAltairHandler({
    path: '/api/altair',
    endpoint: '/api/graphql',
  });
  await testApiHandler({
    handler: async (req, res) => {
      await unpkgHandler(req, res);
    },
    url: '/api/altair',
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
"<!doctype html>
<html>

<head>
  <meta charset=\\"utf-8\\">
  <title>Altair</title>
  <base href=\\"/api/altair/\\">
  <meta name=\\"viewport\\" content=\\"width=device-width,initial-scale=1\\">
  <link rel=\\"icon\\" type=\\"image/x-icon\\" href=\\"favicon.ico\\">
  <link href=\\"styles.css\\" rel=\\"stylesheet\\" />
</head>

<body>
"
`);
    },
  });

  await testApiHandler({
    handler: async (req, res) => {
      await unpkgHandler(req, res);
    },
    url: '/api/altair/styles.css',
    async test({ fetch }) {
      expect(
        (
          await (
            await fetch({
              method: 'GET',
            })
          ).text()
        ).slice(0, 300)
      ).toMatchInlineSnapshot(
        `"@charset \\"UTF-8\\";[class*=ant-]::-ms-clear,[class*=ant-] input::-ms-clear,[class*=ant-] input::-ms-reveal,[class^=ant-]::-ms-clear,[class^=ant-] input::-ms-clear,[class^=ant-] input::-ms-reveal{display:none}body,html{width:100%}input::-ms-clear,input::-ms-reveal{display:none}*,:after,:before{box-sizi"`
      );
    },
  });

  function buildContext(_args: import('@graphql-ez/nextjs').BuildContextArgs) {
    return {
      foo: 'bar',
    };
  }

  const { query } = await CreateNextjsTestClient({
    buildContext,
    ez: {
      plugins: [
        ezUnpkgAltairIDE(),
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
    {
      "data": {
        "hello": "Hello World!",
      },
    }
  `);

  expect(await warnCalled.promise).toMatchInlineSnapshot(`
    [
      "[graphql-ez] You don't need to add the Altair plugin in your EZ App for Next.js, use \\"UnpkgAltairHandler\\" directly in your API Routes.",
    ]
  `);
});
