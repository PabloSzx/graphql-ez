import {
  CommonSchema,
  createDeferredPromise,
  startExpressServer,
  startFastifyServer,
  startHapiServer,
  startHTTPServer,
  startKoaServer,
  startNextJSServer,
} from 'graphql-ez-testing';

import { ezVoyager } from '../src';

test('fastify', async () => {
  const { request } = await startFastifyServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [ezVoyager()],
      },
    },
  });

  expect(
    await request({
      path: '/voyager',
      method: 'GET',
    })
  ).toMatchInlineSnapshot(`
    "
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset=utf-8 />
        <meta name=\\"viewport\\" content=\\"user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0\\">
        <title>GraphQL Voyager</title>
        <style>
          body {
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100vh;
            overflow: hidden;
          }
          #voyager {
            height: 100vh;
          }
        </style>
        <link rel=\\"stylesheet\\"
          href=\\"https://cdn.jsdelivr.net/npm/graphql-voyager@1.0.0-rc.31/dist/voyager.css\\"
        />
        <link rel=\\"shortcut icon\\" href=\\"https://i.imgur.com/SEC809s.png\\" />
        <script src=\\"https://cdn.jsdelivr.net/fetch/2.0.1/fetch.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/react@16/umd/react.production.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/react-dom@16/umd/react-dom.production.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/graphql-voyager@1.0.0-rc.31/dist/voyager.min.js\\"></script>
      </head>
      <body>
        <main id=\\"voyager\\">
          <h1 style=\\"text-align: center; color: #5d7e86;\\"> Loading... </h1>
        </main>
        <script>
    window.addEventListener('load', function(event) {
      function introspectionProvider(introspectionQuery) {
        return fetch('/graphql', {
          method: 'post',
          headers: Object.assign({}, {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }, {}),
          body: JSON.stringify({query: introspectionQuery}),
        }).then(function (response) {
          return response.text();
        }).then(function (responseBody) {
          try {
            return JSON.parse(responseBody);
          } catch (error) {
            return responseBody;
          }
        });
      }

      GraphQLVoyager.init(document.getElementById('voyager'), {
        introspection: introspectionProvider,
        displayOptions: undefined,
      })
    })
        </script>
      </body>
      </html>
      "
  `);
});

test('express', async () => {
  const { request } = await startExpressServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [
          ezVoyager({
            path: '/voyager2',
          }),
        ],
      },
    },
  });

  expect(
    await request({
      path: '/voyager2',
      method: 'GET',
    })
  ).toMatchInlineSnapshot(`
    "
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset=utf-8 />
        <meta name=\\"viewport\\" content=\\"user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0\\">
        <title>GraphQL Voyager</title>
        <style>
          body {
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100vh;
            overflow: hidden;
          }
          #voyager {
            height: 100vh;
          }
        </style>
        <link rel=\\"stylesheet\\"
          href=\\"https://cdn.jsdelivr.net/npm/graphql-voyager@1.0.0-rc.31/dist/voyager.css\\"
        />
        <link rel=\\"shortcut icon\\" href=\\"https://i.imgur.com/SEC809s.png\\" />
        <script src=\\"https://cdn.jsdelivr.net/fetch/2.0.1/fetch.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/react@16/umd/react.production.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/react-dom@16/umd/react-dom.production.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/graphql-voyager@1.0.0-rc.31/dist/voyager.min.js\\"></script>
      </head>
      <body>
        <main id=\\"voyager\\">
          <h1 style=\\"text-align: center; color: #5d7e86;\\"> Loading... </h1>
        </main>
        <script>
    window.addEventListener('load', function(event) {
      function introspectionProvider(introspectionQuery) {
        return fetch('/graphql', {
          method: 'post',
          headers: Object.assign({}, {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }, {}),
          body: JSON.stringify({query: introspectionQuery}),
        }).then(function (response) {
          return response.text();
        }).then(function (responseBody) {
          try {
            return JSON.parse(responseBody);
          } catch (error) {
            return responseBody;
          }
        });
      }

      GraphQLVoyager.init(document.getElementById('voyager'), {
        introspection: introspectionProvider,
        displayOptions: undefined,
      })
    })
        </script>
      </body>
      </html>
      "
  `);
});

test('http', async () => {
  const { request } = await startHTTPServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [
          ezVoyager({
            headers: '{hello: 123}',
          }),
        ],
      },
    },
  });

  expect(
    await request({
      path: '/voyager',
      method: 'GET',
    })
  ).toMatchInlineSnapshot(`
    "
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset=utf-8 />
        <meta name=\\"viewport\\" content=\\"user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0\\">
        <title>GraphQL Voyager</title>
        <style>
          body {
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100vh;
            overflow: hidden;
          }
          #voyager {
            height: 100vh;
          }
        </style>
        <link rel=\\"stylesheet\\"
          href=\\"https://cdn.jsdelivr.net/npm/graphql-voyager@1.0.0-rc.31/dist/voyager.css\\"
        />
        <link rel=\\"shortcut icon\\" href=\\"https://i.imgur.com/SEC809s.png\\" />
        <script src=\\"https://cdn.jsdelivr.net/fetch/2.0.1/fetch.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/react@16/umd/react.production.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/react-dom@16/umd/react-dom.production.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/graphql-voyager@1.0.0-rc.31/dist/voyager.min.js\\"></script>
      </head>
      <body>
        <main id=\\"voyager\\">
          <h1 style=\\"text-align: center; color: #5d7e86;\\"> Loading... </h1>
        </main>
        <script>
    window.addEventListener('load', function(event) {
      function introspectionProvider(introspectionQuery) {
        return fetch('/graphql', {
          method: 'post',
          headers: Object.assign({}, {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }, {hello: 123}),
          body: JSON.stringify({query: introspectionQuery}),
        }).then(function (response) {
          return response.text();
        }).then(function (responseBody) {
          try {
            return JSON.parse(responseBody);
          } catch (error) {
            return responseBody;
          }
        });
      }

      GraphQLVoyager.init(document.getElementById('voyager'), {
        introspection: introspectionProvider,
        displayOptions: undefined,
      })
    })
        </script>
      </body>
      </html>
      "
  `);
});

test('hapi', async () => {
  const { request } = await startHapiServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [
          ezVoyager({
            credentials: 'include',
            displayOptions: {
              hideRoot: true,
            },
            headers: {
              hello: 123,
            },
          }),
        ],
      },
    },
  });

  expect(
    await request({
      path: '/voyager',
      method: 'GET',
    })
  ).toMatchInlineSnapshot(`
    "
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset=utf-8 />
        <meta name=\\"viewport\\" content=\\"user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0\\">
        <title>GraphQL Voyager</title>
        <style>
          body {
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100vh;
            overflow: hidden;
          }
          #voyager {
            height: 100vh;
          }
        </style>
        <link rel=\\"stylesheet\\"
          href=\\"https://cdn.jsdelivr.net/npm/graphql-voyager@1.0.0-rc.31/dist/voyager.css\\"
        />
        <link rel=\\"shortcut icon\\" href=\\"https://i.imgur.com/SEC809s.png\\" />
        <script src=\\"https://cdn.jsdelivr.net/fetch/2.0.1/fetch.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/react@16/umd/react.production.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/react-dom@16/umd/react-dom.production.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/graphql-voyager@1.0.0-rc.31/dist/voyager.min.js\\"></script>
      </head>
      <body>
        <main id=\\"voyager\\">
          <h1 style=\\"text-align: center; color: #5d7e86;\\"> Loading... </h1>
        </main>
        <script>
    window.addEventListener('load', function(event) {
      function introspectionProvider(introspectionQuery) {
        return fetch('/graphql', {
          method: 'post',
          headers: Object.assign({}, {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }, {\\"hello\\":123}),
          body: JSON.stringify({query: introspectionQuery}),
          credentials: \\"include\\",
        }).then(function (response) {
          return response.text();
        }).then(function (responseBody) {
          try {
            return JSON.parse(responseBody);
          } catch (error) {
            return responseBody;
          }
        });
      }

      GraphQLVoyager.init(document.getElementById('voyager'), {
        introspection: introspectionProvider,
        displayOptions: {\\"hideRoot\\":true},
      })
    })
        </script>
      </body>
      </html>
      "
  `);
});

test('koa', async () => {
  const { request } = await startKoaServer({
    createOptions: {
      schema: [CommonSchema],
      ez: {
        plugins: [
          ezVoyager({
            transformHtml(html) {
              return `<!--OK-->${html}`;
            },
          }),
        ],
      },
    },
  });

  expect(
    await request({
      path: '/voyager',
      method: 'GET',
    })
  ).toMatchInlineSnapshot(`
    "<!--OK-->
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset=utf-8 />
        <meta name=\\"viewport\\" content=\\"user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0\\">
        <title>GraphQL Voyager</title>
        <style>
          body {
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100vh;
            overflow: hidden;
          }
          #voyager {
            height: 100vh;
          }
        </style>
        <link rel=\\"stylesheet\\"
          href=\\"https://cdn.jsdelivr.net/npm/graphql-voyager@1.0.0-rc.31/dist/voyager.css\\"
        />
        <link rel=\\"shortcut icon\\" href=\\"https://i.imgur.com/SEC809s.png\\" />
        <script src=\\"https://cdn.jsdelivr.net/fetch/2.0.1/fetch.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/react@16/umd/react.production.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/react-dom@16/umd/react-dom.production.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/graphql-voyager@1.0.0-rc.31/dist/voyager.min.js\\"></script>
      </head>
      <body>
        <main id=\\"voyager\\">
          <h1 style=\\"text-align: center; color: #5d7e86;\\"> Loading... </h1>
        </main>
        <script>
    window.addEventListener('load', function(event) {
      function introspectionProvider(introspectionQuery) {
        return fetch('/graphql', {
          method: 'post',
          headers: Object.assign({}, {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }, {}),
          body: JSON.stringify({query: introspectionQuery}),
        }).then(function (response) {
          return response.text();
        }).then(function (responseBody) {
          try {
            return JSON.parse(responseBody);
          } catch (error) {
            return responseBody;
          }
        });
      }

      GraphQLVoyager.init(document.getElementById('voyager'), {
        introspection: introspectionProvider,
        displayOptions: undefined,
      })
    })
        </script>
      </body>
      </html>
      "
  `);
});

test('nextjs', async () => {
  const warnCalled = createDeferredPromise<unknown>();

  const prevWarn = console.warn;
  const warnWatcher = (...message: unknown[]) => {
    if (typeof message[0] === 'string' && message[0].startsWith('[graphql-ez]')) {
      warnCalled.resolve(message);
    } else {
      prevWarn(...message);
    }
  };
  console.warn = warnWatcher;

  const { request, query } = await startNextJSServer([__dirname, 'nextjs']);

  expect(await query('{hello}')).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "hello": "Hello World!",
      },
    }
  `);

  expect(
    await request({
      path: '/api/voyager',
      method: 'GET',
    })
  ).toMatchInlineSnapshot(`
    "
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset=utf-8 />
        <meta name=\\"viewport\\" content=\\"user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0\\">
        <title>GraphQL Voyager</title>
        <style>
          body {
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100vh;
            overflow: hidden;
          }
          #voyager {
            height: 100vh;
          }
        </style>
        <link rel=\\"stylesheet\\"
          href=\\"https://cdn.jsdelivr.net/npm/graphql-voyager@1.0.0-rc.31/dist/voyager.css\\"
        />
        <link rel=\\"shortcut icon\\" href=\\"https://i.imgur.com/SEC809s.png\\" />
        <script src=\\"https://cdn.jsdelivr.net/fetch/2.0.1/fetch.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/react@16/umd/react.production.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/react-dom@16/umd/react-dom.production.min.js\\"></script>
        <script src=\\"https://cdn.jsdelivr.net/npm/graphql-voyager@1.0.0-rc.31/dist/voyager.min.js\\"></script>
      </head>
      <body>
        <main id=\\"voyager\\">
          <h1 style=\\"text-align: center; color: #5d7e86;\\"> Loading... </h1>
        </main>
        <script>
    window.addEventListener('load', function(event) {
      function introspectionProvider(introspectionQuery) {
        return fetch('/api/graphql', {
          method: 'post',
          headers: Object.assign({}, {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }, {}),
          body: JSON.stringify({query: introspectionQuery}),
        }).then(function (response) {
          return response.text();
        }).then(function (responseBody) {
          try {
            return JSON.parse(responseBody);
          } catch (error) {
            return responseBody;
          }
        });
      }

      GraphQLVoyager.init(document.getElementById('voyager'), {
        introspection: introspectionProvider,
        displayOptions: undefined,
      })
    })
        </script>
      </body>
      </html>
      "
  `);

  expect(await warnCalled.promise).toMatchInlineSnapshot(`
    Array [
      "[graphql-ez] You don't need to add the Voyager plugin in your EZ App for Next.js, use \\"VoyagerHandler\\" directly in your API Routes.",
    ]
  `);
});
